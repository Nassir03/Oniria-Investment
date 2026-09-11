"""project toolkit assets"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0005_project_toolkit_assets'
down_revision = '0004_admin_notifications'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'project_toolkit_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('project_slug', sa.String(160), nullable=False, server_default='all-projects'),
        sa.Column('category', sa.String(40), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_url', sa.Text(), nullable=False),
        sa.Column('preview_image_url', sa.Text(), nullable=True),
        sa.Column('storage_path', sa.Text(), nullable=True),
        sa.Column('media_type', sa.String(30), nullable=False, server_default='image'),
        sa.Column('file_name', sa.String(300), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('is_downloadable', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_project_toolkit_assets_project_id', 'project_toolkit_assets', ['project_id'])
    op.create_index('ix_project_toolkit_assets_project_slug', 'project_toolkit_assets', ['project_slug'])
    op.create_index('ix_project_toolkit_assets_category', 'project_toolkit_assets', ['category'])
    op.create_index('ix_project_toolkit_assets_is_public', 'project_toolkit_assets', ['is_public'])
    op.alter_column('project_toolkit_assets', 'project_slug', server_default=None)
    op.alter_column('project_toolkit_assets', 'media_type', server_default=None)
    op.alter_column('project_toolkit_assets', 'is_public', server_default=None)
    op.alter_column('project_toolkit_assets', 'is_downloadable', server_default=None)
    op.alter_column('project_toolkit_assets', 'sort_order', server_default=None)


def downgrade():
    op.drop_index('ix_project_toolkit_assets_is_public', table_name='project_toolkit_assets')
    op.drop_index('ix_project_toolkit_assets_category', table_name='project_toolkit_assets')
    op.drop_index('ix_project_toolkit_assets_project_slug', table_name='project_toolkit_assets')
    op.drop_index('ix_project_toolkit_assets_project_id', table_name='project_toolkit_assets')
    op.drop_table('project_toolkit_assets')
