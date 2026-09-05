import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def admin_route_methods(path: str) -> set[str]:
    """Read FastAPI route decorators without importing optional runtime SDKs."""
    source = (ROOT / 'app' / 'api' / 'routes' / 'admin.py').read_text(encoding='utf-8')
    tree = ast.parse(source)
    methods: set[str] = set()

    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for decorator in node.decorator_list:
            if not isinstance(decorator, ast.Call) or not isinstance(decorator.func, ast.Attribute):
                continue
            if not isinstance(decorator.func.value, ast.Name) or decorator.func.value.id != 'router':
                continue
            method = decorator.func.attr.upper()
            if method not in {'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'}:
                continue
            if not decorator.args or not isinstance(decorator.args[0], ast.Constant):
                continue
            if decorator.args[0].value == path:
                methods.add(method)

    return methods


def test_staff_delete_routes_keep_canonical_and_edge_compatible_methods():
    assert 'DELETE' in admin_route_methods('/staff/{user_id}')
    assert 'POST' in admin_route_methods('/staff/{user_id}/delete')


def test_news_delete_routes_keep_canonical_and_edge_compatible_methods():
    assert 'DELETE' in admin_route_methods('/news/{article_id}')
    assert 'POST' in admin_route_methods('/news/{article_id}/delete')


def test_toolkit_admin_route_contract_is_complete():
    assert 'GET' in admin_route_methods('/toolkit-assets')
    assert 'POST' in admin_route_methods('/toolkit-assets')
    assert 'PATCH' in admin_route_methods('/toolkit-assets/{asset_id}')
    assert 'DELETE' in admin_route_methods('/toolkit-assets/{asset_id}')
    assert 'POST' in admin_route_methods('/toolkit-assets/{asset_id}/update')
    assert 'POST' in admin_route_methods('/toolkit-assets/{asset_id}/delete')


def test_cloudflare_dynamic_routes_run_worker_first():
    config = json.loads((ROOT / 'frontend' / 'wrangler.jsonc').read_text(encoding='utf-8'))
    routes = config['assets']['run_worker_first']
    assert routes is True or {'/api/*', '/media/*'}.issubset(set(routes))


def test_toolkit_sql_editor_migration_is_present():
    migration = (ROOT / 'database' / 'migrations' / '007_project_toolkit_assets.sql').read_text(encoding='utf-8').lower()
    assert 'create table if not exists project_toolkit_assets' in migration
    assert 'preview_storage_path' in migration


def test_backend_env_example_uses_settings_key_names():
    env_text = (ROOT / '.env.example').read_text(encoding='utf-8')
    assert 'SUPABASE_SERVICE_ROLE_KEY=' in env_text
    assert 'SUPABASE_SECRET_KEY=' not in env_text
    assert 'supabase.supabase.co' not in env_text
