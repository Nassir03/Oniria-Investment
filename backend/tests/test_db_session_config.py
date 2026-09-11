from app.db.session import _connect_args


def test_local_database_connect_args_do_not_force_ssl():
    args = _connect_args('postgresql+asyncpg://postgres:postgres@127.0.0.1:3310/oniria')

    assert args == {'statement_cache_size': 0}


def test_remote_database_connect_args_require_ssl():
    args = _connect_args('postgresql+asyncpg://postgres:secret@db.supabase.co:6543/postgres')

    assert args == {'statement_cache_size': 0, 'ssl': 'require'}
