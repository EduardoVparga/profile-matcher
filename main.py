import httpx
import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from typing import List, Optional

class StrengthDetail(BaseModel):
    name: Optional[str] = None
    proficiency: Optional[str] = None

class Person(BaseModel):
    name: str
    description: str
    avatar: str
    checked: bool
    publicId: str = Field(..., alias="publicId")

class SearchRequest(BaseModel):
    query: str

class PersonDetails(BaseModel):
    name: str
    professional_headline: Optional[str] = None
    remoter: bool = False
    location: Optional[str] = None
    summary_of_bio: Optional[str] = None
    stats_jobs: int = 0
    stats_education: int = 0
    stats_strengths: int = 0
    strengths: List[StrengthDetail] = [] 
    last_job_period: Optional[str] = None

app = FastAPI()

app.mount("/static", StaticFiles(directory="./static"), name="static")

templates = Jinja2Templates(directory="./templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/search", response_model=List[Person])
async def search_people(search_request: SearchRequest):
    search_query = search_request.query
    if not search_query:
        return []

    TORRE_API_URL = "http://arda.torre.co/entities/_searchStream"
    
    external_request_body = {
        "query": search_query,
        "meta": False,
        "limit": 5,
        "torreGgId": "2076714",
        "excludeContacts": True,
        "excludedPeople": []
    }

    results: List[Person] = []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            async with client.stream("POST", TORRE_API_URL, json=external_request_body) as response:
                if response.status_code != 200:
                    print(f"Error calling Torre API: {response.status_code} - {await response.aread()}")
                    return []

                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            person_data = {
                                "name": data.get("name") or "N/A",
                                "description": data.get("professionalHeadline") or "",
                                "avatar": data.get("imageUrl") or "",
                                "checked": data.get("verified") or False,
                                "publicId": data.get("username") or "" 
                            }
                            if person_data["publicId"]:
                                results.append(Person(**person_data))
                        except json.JSONDecodeError:
                            print(f"Could not decode line: {line}")
                        except Exception as pydantic_error:
                             print(f"Pydantic validation error for line {line}: {pydantic_error}")

    except httpx.RequestError as exc:
        print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
        return []

    return results

@app.get("/api/person/{username}", response_model=PersonDetails)
async def get_person_details(username: str):
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    PROFILE_API_URL = f"https://torre.ai/api/genome/bios/{username}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(PROFILE_API_URL)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Person '{username}' not found.")
            
            response.raise_for_status() 

            data = response.json()
            person_data = data.get("person", {})
            stats_data = data.get("stats", {})
            strengths_data = data.get("strengths", [])
            jobs_data = data.get("jobs", [])
            
            last_job_period = "N/A"
            if jobs_data:
                last_job = jobs_data[0]
                from_date = f"{last_job.get('fromMonth', '')} {last_job.get('fromYear', '')}".strip()
                to_date = f"{last_job.get('toMonth', '')} {last_job.get('toYear', '')}".strip()
                if to_date and to_date != from_date:
                    last_job_period = f"{from_date} - {to_date}"
                else:
                    last_job_period = f"{from_date} - Present"

            processed_strengths = [
                StrengthDetail(name=s.get("name"), proficiency=s.get("proficiency"))
                for s in strengths_data
            ]
            
            details = PersonDetails(
                name=person_data.get("name", "N/A"),
                professional_headline=person_data.get("professionalHeadline"),
                remoter=person_data.get("flags", {}).get("remoter", False),
                location=person_data.get("location", {}).get("name"),
                summary_of_bio=person_data.get("summaryOfBio"),
                stats_jobs=stats_data.get("jobs", 0),
                stats_education=stats_data.get("education", 0),
                stats_strengths=stats_data.get("strengths", 0),
                strengths=processed_strengths, # Se pasa la lista completa
                last_job_period=last_job_period
            )
            return details

    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Service unavailable: Could not connect to Torre API. Error: {exc}")