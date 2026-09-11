"""track toolkit preview storage path

Revision ID: 0006_toolkit_preview_storage_path
Revises: 0005_project_toolkit_assets
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_toolkit_preview_path"
down_revision = "0005_project_toolkit_assets"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('project_toolkit_assets', sa.Column('preview_storage_path', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('project_toolkit_assets', 'preview_storage_path')
