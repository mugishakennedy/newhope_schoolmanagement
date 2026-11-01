from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_SECRETS = {
    "",
    "change-me",
    "dev-only-change-me",
    "dev-only-change-me-use-a-real-32-char-secret",
    "secret",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"

    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "newhope"

    secret_key: str = "dev-only-change-me-use-a-real-32-char-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    refresh_cookie_path: str = "/auth"
    refresh_cookie_name: str = "newhope_refresh"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    enforce_https: bool = False

    login_rate_limit: int = 5
    register_rate_limit: int = 3
    rate_limit_window_seconds: int = 60

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{quote_plus(self.db_user)}:"
            f"{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def database_async_url(self) -> str:
        return (
            f"postgresql+asyncpg://{quote_plus(self.db_user)}:"
            f"{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @model_validator(mode="after")
    def validate_security_settings(self) -> Settings:
        if self.jwt_algorithm not in {"HS256", "HS384", "HS512"}:
            raise ValueError("JWT_ALGORITHM must be HS256, HS384, or HS512")

        if self.cookie_samesite.lower() not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAMESITE must be lax, strict, or none")

        if self.cookie_samesite.lower() == "none" and not self.cookie_secure:
            raise ValueError("COOKIE_SECURE must be enabled when SameSite=None")

        if self.environment.lower() == "production":
            if (
                self.secret_key.lower() in _INSECURE_SECRETS
                or len(self.secret_key.encode("utf-8")) < 32
            ):
                raise ValueError(
                    "SECRET_KEY must be set and at least 32 characters long "
                    "in production"
                )
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE must be enabled in production")
            if not self.cors_origin_list:
                raise ValueError("CORS_ORIGINS must be configured in production")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
