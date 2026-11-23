"use client";
import {useEffect,useState} from "react";
const API=process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000";
type Wallet={id:string;name:string;currency:string;balance:string};
type Transfer={id:string;amount:string;currency:string;description?:string;createdAt:string;status:string;senderWalletId:string;receiverWalletId:string};
export default function Home(){
 const [token,setToken]=useState(""); const [wallets,setWallets]=useState<Wallet[]>([]);
 const [transfers,setTransfers]=useState<Transfer[]>([]); const [email,setEmail]=useState("demo@fincore.local"); const [password,setPassword]=useState("Demo@12345");
 const [toWalletId,setToWalletId]=useState(""); const [amount,setAmount]=useState(""); const [message,setMessage]=useState("");
 async function request(path:string,method="GET",body?:unknown){
  const r=await fetch(`${API}${path}`,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data=await r.json(); if(!r.ok) throw new Error(data.error||"Request failed"); return data;
 }
 async function load(t=token){try{const h={Authorization:`Bearer ${t}`};const [w,tr]=await Promise.all([fetch(`${API}/api/wallets`,{headers:h}),fetch(`${API}/api/transfers`,{headers:h})]);if(!w.ok||!tr.ok)throw new Error("Unable to load dashboard");setWallets(await w.json());setTransfers(await tr.json());}catch(e){setMessage(e instanceof Error?e.message:"Unable to load data")}}
 async function login(){try{const data=await request("/api/auth/login","POST",{email,password});setToken(data.token);setMessage("Signed in successfully");await load(data.token)}catch(e){setMessage(e instanceof Error?e.message:"Login failed")}}
 useEffect(()=>{if(token)load(token)},[token]);
 async function transfer(){try{if(!wallets[0])throw new Error("No source wallet available");await request("/api/transfers","POST",{fromWalletId:wallets[0].id,toWalletId,amount,currency:wallets[0].currency,description:"FinCore demo transfer"});setMessage("Transfer completed");setAmount("");await load()}catch(e){setMessage(e instanceof Error?e.message:"Transfer failed")}}
 if(!token)return <main className="shell"><header className="top"><div className="brand">FinCore</div><span className="muted">Digital Wallet • Demo Environment</span></header><section className="card" style={{maxWidth:440,margin:"60px auto"}}><h1>Welcome back</h1><p className="muted">Sign in to your simulated wallet.</p><div className="form" style={{flexDirection:"column"}}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password"/><button className="btn" onClick={login}>Sign in</button></div><p className="muted">Demo: demo@fincore.local / Demo@12345</p>{message&&<p>{message}</p>}</section></main>;
 const total=wallets.reduce((n,w)=>n+Number(w.balance),0);
 return <main className="shell"><header className="top"><div><div className="brand">FinCore</div><span className="muted">Digital Wallet Dashboard</span></div><button className="btn secondary" onClick={()=>{setToken("");setWallets([]);}}>Sign out</button></header>
 <div className="notice">Demo environment: balances and transfers are simulated. No real money is moved.</div>
 <section className="grid"><div className="card"><span className="muted">Total wallet balance</span><div className="balance">₹{total.toFixed(2)}</div><span className="muted">Across {wallets.length} wallet(s)</span></div><div className="card"><span className="muted">Transactions</span><div className="balance">{transfers.length}</div><span className="muted">Recent transfers</span></div><div className="card"><span className="muted">Account status</span><div className="balance" style={{fontSize:24}}>Active</div><span className="muted">Demo customer account</span></div></section>
 <section className="card panel"><h2>My wallets</h2>{wallets.map(w=><div className="rowitem" key={w.id}><span>{w.name}<small className="muted"> · {w.currency}</small></span><strong>{w.currency==="INR"?"₹":""}{Number(w.balance).toFixed(2)}</strong></div>)}</section>
 <section className="card panel"><h2>Send money</h2><p className="muted">Enter the recipient wallet ID. Transfers are recorded in the double-entry ledger.</p><div className="form"><input placeholder="Recipient wallet ID" value={toWalletId} onChange={e=>setToWalletId(e.target.value)}/><input placeholder="Amount (e.g. 100.00)" value={amount} onChange={e=>setAmount(e.target.value)}/><button className="btn" onClick={transfer}>Transfer</button></div>{message&&<p>{message}</p>}</section>
 <section className="card panel"><h2>Recent transactions</h2>{transfers.length===0?<p className="muted">No transactions yet.</p>:transfers.map(t=><div className="rowitem" key={t.id}><span>{t.description||"Wallet transfer"}<br/><small className="muted">{new Date(t.createdAt).toLocaleString()} · {t.status}</small></span><strong>{t.currency} {Number(t.amount).toFixed(2)}</strong></div>)}</section>
 </main>
}
