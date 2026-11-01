from pydantic import BaseModel, ConfigDict, Field


class ModuleCreate(BaseModel):
    module_code: str = Field(min_length=1, max_length=50)
    module_name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_code: str
    module_name: str
    description: str | None
