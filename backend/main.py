from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import List
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.responses import PlainTextResponse


# 1. SECURITY & JWT CONFIGURATION
SECRET_KEY = "your-super-secret-key-change-this" # Keep this private!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. JWT HELPER FUNCTIONS
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 3. THE BRIDGE (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://practice-project1-ashen.vercel.app/"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. DATABASE CONNECTION
client = AsyncIOMotorClient("mongodb+srv://ankitkumar123:<db_password>@cluster0.q8pj8i7.mongodb.net/?appName=Cluster0")
db = client.task_manager_db

# 5. BLUEPRINTS (Pydantic Models)
class User(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Task(BaseModel):
    title: str
    completed: bool = False
    category: str = "General"
    owner: str 

# 6. AUTHENTICATION ROUTES
@app.post("/register")
async def register(user: User):
    existing_user = await db["users"].find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password
    }
    await db["users"].insert_one(new_user)
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(user: UserLogin):
    db_user = await db["users"].find_one({"username": user.username})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create the secure JWT token
    token = create_access_token(data={"sub": db_user["username"]})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "username": db_user["username"]
    }

# 7. TASK ROUTES
@app.get("/tasks")
async def get_tasks(username: str):
    tasks = await db["tasks"].find({"owner": username}).to_list(100)
    for t in tasks:
        t["_id"] = str(t["_id"])
    return tasks

@app.post("/tasks")
async def create_task(task: Task):
    new_task = await db["tasks"].insert_one(task.dict())
    return {"id": str(new_task.inserted_id)}

@app.put("/tasks/{task_id}")
async def toggle_task(task_id: str, completed: bool):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    await db["tasks"].update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": completed}}
    )
    return {"status": "updated"}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    await db["tasks"].delete_one({"_id": ObjectId(task_id)})
    return {"message": "Task deleted successfully"}

@app.delete("/tasks/clear/completed/{username}")
async def clear_completed(username: str):
    await db["tasks"].delete_many({"owner": username, "completed": True})
    return {"message": "Cleared completed tasks"}

@app.get("/", response_class=PlainTextResponse)
async def root():
    return "FastAPI server is running successfully 🚀"