const express=require("express"),path=require("path"),pg=require("pg"),jwt=require("jsonwebtoken"),bcrypt=require("bcryptjs");
const {Pool}=pg, app=express(), PORT=process.env.PORT||3000, SECRET=process.env.JWT_SECRET||"CHANGE_ME_NOW";
if(!process.env.DATABASE_URL) console.warn("DATABASE_URL is not set");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?.includes("railway")?{rejectUnauthorized:false}:undefined});
app.use(express.json({limit:"1mb"}));app.use(express.static(path.join(__dirname,"public")));
async function init(){
 await pool.query(`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin');
 CREATE TABLE IF NOT EXISTS customers(id SERIAL PRIMARY KEY,customer_id TEXT UNIQUE NOT NULL,name TEXT NOT NULL,phone TEXT DEFAULT '',fridge_no TEXT NOT NULL,date TEXT,rent NUMERIC DEFAULT 0,advance NUMERIC DEFAULT 0,brand TEXT DEFAULT '',status TEXT DEFAULT 'active');
 CREATE TABLE IF NOT EXISTS payments(id SERIAL PRIMARY KEY,customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,month TEXT NOT NULL,amount NUMERIC DEFAULT 0,paid BOOLEAN DEFAULT FALSE,UNIQUE(customer_id,month));`);
 let u=await pool.query("SELECT 1 FROM users LIMIT 1"); if(!u.rowCount) await pool.query("INSERT INTO users(username,password,role) VALUES($1,$2,$3)",["admin",bcrypt.hashSync("1234",10),"admin"]);
}
function auth(req,res,next){try{req.user=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),SECRET);next()}catch(e){res.status(401).json({error:"Unauthorized"})}}
app.post("/api/login",async(req,res)=>{let r=await pool.query("SELECT * FROM users WHERE username=$1",[req.body.username]);let u=r.rows[0];if(!u||!bcrypt.compareSync(req.body.password,u.password))return res.status(401).json({error:"ভুল username/password"});res.json({token:jwt.sign({id:u.id,username:u.username,role:u.role},SECRET,{expiresIn:"12h"})})});
app.get("/api/customers",auth,async(req,res)=>res.json((await pool.query("SELECT * FROM customers ORDER BY id DESC")).rows));
app.post("/api/customers",auth,async(req,res)=>{let x=req.body,cid=x.customer_id||"LR-"+Date.now();if(!x.name||!x.fridge_no)return res.status(400).json({error:"নাম ও Fridge No দরকার"});try{let r=await pool.query("INSERT INTO customers(customer_id,name,phone,fridge_no,date,rent,advance,brand,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",[cid,x.name,x.phone||"",x.fridge_no,x.date||"",+x.rent||0,+x.advance||0,x.brand||"",x.status||"active"]);res.json(r.rows[0])}catch(e){res.status(400).json({error:"Customer ID আগে থেকেই আছে"})}});
app.delete("/api/customers/:id",auth,async(req,res)=>{await pool.query("DELETE FROM customers WHERE id=$1",[req.params.id]);res.json({ok:true})});
app.get("/api/payments/:id",auth,async(req,res)=>res.json((await pool.query("SELECT * FROM payments WHERE customer_id=$1 ORDER BY month DESC",[req.params.id])).rows));
app.post("/api/payments",auth,async(req,res)=>{let x=req.body;await pool.query("INSERT INTO payments(customer_id,month,amount,paid) VALUES($1,$2,$3,$4) ON CONFLICT(customer_id,month) DO UPDATE SET amount=EXCLUDED.amount,paid=EXCLUDED.paid",[x.customer_id,x.month,+x.amount||0,!!x.paid]);res.json({ok:true})});
app.get("/api/dashboard",auth,async(req,res)=>{let a=(await pool.query("SELECT COUNT(*)::int n FROM customers")).rows[0].n,b=(await pool.query("SELECT COUNT(*)::int n FROM customers WHERE status='active'")).rows[0].n,c=+(await pool.query("SELECT COALESCE(SUM(rent),0) n FROM customers WHERE status='active'")).rows[0].n,m=new Date().toISOString().slice(0,7),d=+(await pool.query("SELECT COALESCE(SUM(amount),0) n FROM payments WHERE month=$1 AND paid=true",[m])).rows[0].n;res.json({customers:a,fridges:b,rent:c,paid:d,due:Math.max(0,c-d)})});
app.get("/*splat",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
init().then(()=>app.listen(PORT,()=>console.log("Limon Refrigerator running on "+PORT))).catch(e=>{console.error(e);process.exit(1)});
