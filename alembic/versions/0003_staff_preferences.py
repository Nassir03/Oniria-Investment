"""staff profile preferences"""
from alembic import op
import sqlalchemy as sa

revision = '0003_staff_preferences'
down_revision = '0002_site_visit_analytics'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('profiles', sa.Column('phone', sa.String(60), nullable=True))
    op.add_column('profiles', sa.Column('job_title', sa.String(120), nullable=True))
    op.add_column('profiles', sa.Column('department', sa.String(120), nullable=True))
    op.add_column('profiles', sa.Column('preferred_contact_method', sa.String(30), nullable=True))
    op.add_column('profiles', sa.Column('avatar_url', sa.Text(), nullable=True))
    op.add_column('profiles', sa.Column('notification_preferences', sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")))
    op.alter_column('profiles', 'notification_preferences', server_default=None)


def downgrade():
    op.drop_column('profiles', 'notification_preferences')
    op.drop_column('profiles', 'avatar_url')
    op.drop_column('profiles', 'preferred_contact_method')
    op.drop_column('profiles', 'department')
    op.drop_column('profiles', 'job_title')
    op.drop_column('profiles', 'phone')
