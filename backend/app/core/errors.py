from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, field_errors: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.field_errors = field_errors
        super().__init__(message)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, 'request_id', None)


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={
        'code': exc.code, 'message': exc.message, 'request_id': _request_id(request), 'field_errors': exc.field_errors
    })


async def http_error_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={
        'code': f'http_{exc.status_code}', 'message': str(exc.detail), 'request_id': _request_id(request), 'field_errors': None
    })


async def validation_error_handler(request: Request, exc: RequestValidationError):
    fields: dict[str, list[str]] = {}
    for err in exc.errors():
        loc = '.'.join(str(x) for x in err.get('loc', [])[1:]) or 'request'
        fields.setdefault(loc, []).append(err.get('msg', 'Invalid value'))
    return JSONResponse(status_code=422, content={
        'code': 'validation_error', 'message': 'The request contains invalid fields.', 'request_id': _request_id(request), 'field_errors': fields
    })
