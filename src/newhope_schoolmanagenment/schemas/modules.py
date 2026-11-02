from pydantic import BaseModel, ConfigDict


class ModuleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_code: str
    module_name: str


class ModuleRead(ModuleSummary):
    description: str | None
