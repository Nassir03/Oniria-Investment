"""admin in-app notifications"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0004_admin_notifications'
down_revision = '0003_staff_preferences'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'admin_notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(80), nullable=False),
        sa.Column('title', sa.String(180), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('link', sa.String(500), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_admin_notifications_user_id', 'admin_notifications', ['user_id'])
    op.create_index('ix_admin_notifications_type', 'admin_notifications', ['type'])
    op.create_index('ix_admin_notifications_is_read', 'admin_notifications', ['is_read'])
    op.create_index('ix_admin_notifications_created_at', 'admin_notifications', ['created_at'])
    op.create_index(
        'ix_admin_notifications_user_read_created',
        'admin_notifications',
        ['user_id', 'is_read', sa.text('created_at DESC')],
    )
    op.alter_column('admin_notifications', 'is_read', server_default=None)


def downgrade():
    op.drop_index('ix_admin_notifications_user_read_created', table_name='admin_notifications')
    op.drop_index('ix_admin_notifications_created_at', table_name='admin_notifications')
    op.drop_index('ix_admin_notifications_is_read', table_name='admin_notifications')
    op.drop_index('ix_admin_notifications_type', table_name='admin_notifications')
    op.drop_index('ix_admin_notifications_user_id', table_name='admin_notifications')
    op.drop_table('admin_notifications')
