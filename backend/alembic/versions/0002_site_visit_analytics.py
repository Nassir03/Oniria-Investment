"""add public site visit analytics

Revision ID: 0002_site_visit_analytics
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0002_site_visit_analytics'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'site_visits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('path', sa.String(500), nullable=False),
        sa.Column('session_id', sa.String(120)),
        sa.Column('referrer', sa.Text()),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_site_visits_path', 'site_visits', ['path'])
    op.create_index('ix_site_visits_session_id', 'site_visits', ['session_id'])
    op.create_index('ix_site_visits_created_at', 'site_visits', ['created_at'])


def downgrade():
    op.drop_index('ix_site_visits_created_at', table_name='site_visits')
    op.drop_index('ix_site_visits_session_id', table_name='site_visits')
    op.drop_index('ix_site_visits_path', table_name='site_visits')
    op.drop_table('site_visits')
