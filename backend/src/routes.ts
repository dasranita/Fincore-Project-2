import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./prisma";
import { authenticate } from "./middleware/auth";

export const router = Router();
const registerSchema = z.object({ name:z.string().min(2), email:z.string().email(), password:z.string().min(8) });
const loginSchema = z.object({ email:z.string().email(), password:z.string().min(8) });
const transferSchema = z.object({ toWalletId:z.string().min(5), amount:z.string().regex(/^\d+(\.\d{1,2})?$/), currency:z.string().length(3).default("INR"), description:z.string().max(120).optional() });

router.post("/auth/register", async (req,res,next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data:{ name:input.name, email:input.email, passwordHash } });
    const wallet = await prisma.wallet.create({ data:{ userId:user.id, name:"Primary Wallet", currency:"INR", balance:"1000.00" } });
    const token = jwt.sign({}, process.env.JWT_SECRET || "local-only-change-me", { subject:user.id, expiresIn:"2h" });
    res.status(201).json({ token, user:{id:user.id,name:user.name,email:user.email}, wallet });
  } catch(e) { next(e); }
});
router.post("/auth/login", async (req,res,next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where:{email:input.email} });
    if (!user || !(await bcrypt.compare(input.password,user.passwordHash))) return res.status(401).json({error:"Invalid email or password"});
    const token = jwt.sign({}, process.env.JWT_SECRET || "local-only-change-me", { subject:user.id, expiresIn:"2h" });
    res.json({token,user:{id:user.id,name:user.name,email:user.email}});
  } catch(e) { next(e); }
});
router.get("/wallets", authenticate, async(req,res,next) => {
  try { res.json(await prisma.wallet.findMany({where:{userId:req.userId},orderBy:{createdAt:"asc"}})); } catch(e){next(e);}
});
router.post("/wallets", authenticate, async(req,res,next) => {
  try {
    const name = z.string().min(2).max(40).parse(req.body.name);
    const currency = z.string().length(3).parse(req.body.currency || "INR");
    res.status(201).json(await prisma.wallet.create({data:{userId:req.userId!,name,currency}}));
  } catch(e){next(e);}
});
router.post("/beneficiaries", authenticate, async(req,res,next) => {
  try {
    const body=z.object({walletId:z.string(),nickname:z.string().min(2).max(40)}).parse(req.body);
    const wallet=await prisma.wallet.findUnique({where:{id:body.walletId}});
    if(!wallet) return res.status(404).json({error:"Wallet not found"});
    if(wallet.userId===req.userId) return res.status(400).json({error:"Cannot add your own wallet"});
    const item=await prisma.beneficiary.create({data:{userId:req.userId!,beneficiaryWalletId:body.walletId,nickname:body.nickname}});
    res.status(201).json(item);
  } catch(e){next(e);}
});
router.get("/transfers", authenticate, async(req,res,next) => {
  try {
    const wallets=await prisma.wallet.findMany({where:{userId:req.userId},select:{id:true}});
    const ids=wallets.map(w=>w.id);
    const rows=await prisma.transfer.findMany({where:{OR:[{senderWalletId:{in:ids}},{receiverWalletId:{in:ids}}]},include:{sender:true,receiver:true},orderBy:{createdAt:"desc"},take:100});
    res.json(rows);
  } catch(e){next(e);}
});
router.post("/transfers", authenticate, async(req,res,next) => {
  try {
    const input=transferSchema.parse(req.body);
    const key=req.header("Idempotency-Key");
    if(!key || key.length<8 || key.length>100) return res.status(400).json({error:"A valid Idempotency-Key header is required"});
    const sender=await prisma.wallet.findFirst({where:{id:req.body.fromWalletId,userId:req.userId}});
    if(!sender) return res.status(404).json({error:"Source wallet not found"});
    const existing=await prisma.transfer.findUnique({where:{senderWalletId_idempotencyKey:{senderWalletId:sender.id,idempotencyKey:key}}});
    if(existing) return res.json(existing);
    const amount=Number(input.amount);
    if(!Number.isFinite(amount) || amount<=0) return res.status(400).json({error:"Amount must be greater than zero"});
    if(sender.id===input.toWalletId) return res.status(400).json({error:"Cannot transfer to the same wallet"});
    const receiver=await prisma.wallet.findUnique({where:{id:input.toWalletId}});
    if(!receiver || receiver.currency!==input.currency || sender.currency!==input.currency) return res.status(400).json({error:"Recipient wallet or currency is invalid"});
    const transfer=await prisma.$transaction(async(tx)=>{
      const debit=await tx.wallet.updateMany({where:{id:sender.id,balance:{gte:input.amount}},data:{balance:{decrement:input.amount}}});
      if(debit.count!==1) throw new Error("INSUFFICIENT_FUNDS");
      await tx.wallet.update({where:{id:receiver.id},data:{balance:{increment:input.amount}}});
      const record=await tx.transfer.create({data:{senderWalletId:sender.id,receiverWalletId:receiver.id,amount:input.amount,currency:input.currency,description:input.description,idempotencyKey:key}});
      await tx.ledgerEntry.createMany({data:[
        {walletId:sender.id,transferId:record.id,type:"DEBIT",amount:input.amount,currency:input.currency},
        {walletId:receiver.id,transferId:record.id,type:"CREDIT",amount:input.amount,currency:input.currency}
      ]});
      return record;
    },{isolationLevel:"Serializable"});
    res.status(201).json(transfer);
  } catch(e){next(e);}
});
router.get("/ledger", authenticate, async(req,res,next) => {
  try {
    const wallets=await prisma.wallet.findMany({where:{userId:req.userId},select:{id:true}});
    res.json(await prisma.ledgerEntry.findMany({where:{walletId:{in:wallets.map(w=>w.id)}},include:{transfer:true,wallet:true},orderBy:{createdAt:"desc"},take:200}));
  } catch(e){next(e);}
});
