import { z } from "zod";
const schema=z.object({amount:z.string().regex(/^\d+(\.\d{1,2})?$/)});
describe("transfer amount validation",()=>{
 it("accepts a decimal amount",()=>expect(schema.safeParse({amount:"25.50"}).success).toBe(true));
 it("rejects negative amounts",()=>expect(schema.safeParse({amount:"-2"}).success).toBe(false));
 it("rejects more than two decimal places",()=>expect(schema.safeParse({amount:"1.999"}).success).toBe(false));
});
