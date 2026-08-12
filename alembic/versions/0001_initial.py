"""initial ONIRIA schema"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(200)), sa.Column('email', sa.String(320)),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_profiles_email','profiles',['email'])

    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('slug', sa.String(160), nullable=False),
        sa.Column('name', sa.String(200), nullable=False), sa.Column('category', sa.String(100)), sa.Column('location', sa.String(250)),
        sa.Column('summary', sa.Text()), sa.Column('body', sa.JSON()), sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('featured', sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('slug'))
    op.create_index('ix_projects_slug','projects',['slug']); op.create_index('ix_projects_status','projects',['status'])

    op.create_table('project_media',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('url', sa.Text(), nullable=False), sa.Column('alt_text', sa.String(500), nullable=False), sa.Column('media_type', sa.String(30), nullable=False, server_default='image'),
        sa.Column('width', sa.Integer()), sa.Column('height', sa.Integer()), sa.Column('is_concept', sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_project_media_project_id','project_media',['project_id'])

    op.create_table('business_areas',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('slug', sa.String(160), nullable=False), sa.Column('name', sa.String(200), nullable=False),
        sa.Column('summary', sa.Text()), sa.Column('body', sa.JSON()), sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('slug'))
    op.create_index('ix_business_areas_slug','business_areas',['slug'])

    op.create_table('news_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('slug', sa.String(120), nullable=False, unique=True), sa.Column('name', sa.String(160), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_news_categories_slug','news_categories',['slug'])

    op.create_table('news_articles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('slug', sa.String(180), nullable=False, unique=True), sa.Column('title', sa.String(300), nullable=False),
        sa.Column('excerpt', sa.Text()), sa.Column('body', sa.JSON(), nullable=False), sa.Column('hero_image_url', sa.Text()), sa.Column('hero_image_alt', sa.String(500)),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'), sa.Column('published_at', sa.DateTime(timezone=True)),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')), sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')), sa.Column('seo_title', sa.String(70)), sa.Column('meta_description', sa.String(180)),
        sa.Column('og_image_url', sa.Text()), sa.Column('deleted_at', sa.DateTime(timezone=True)), sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_news_articles_slug','news_articles',['slug']); op.create_index('ix_news_articles_status','news_articles',['status']); op.create_index('ix_news_articles_published_at','news_articles',['published_at']); op.create_index('ix_news_status_published_desc','news_articles',['status',sa.text('published_at DESC')])

    op.create_table('news_article_categories',
        sa.Column('article_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('news_articles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('news_categories.id', ondelete='CASCADE'), primary_key=True))

    op.create_table('staff_roles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='CASCADE'), primary_key=True), sa.Column('role', sa.String(30), primary_key=True),
        sa.Column('granted_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')), sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))

    op.create_table('leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('reference_no', sa.String(40), nullable=False, unique=True), sa.Column('source', sa.String(50), nullable=False, server_default='website'),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='SET NULL')), sa.Column('first_name', sa.String(100), nullable=False), sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(320), nullable=False), sa.Column('phone', sa.String(60)), sa.Column('country', sa.String(120)), sa.Column('enquiry_type', sa.String(100)),
        sa.Column('preferred_contact_method', sa.String(30)), sa.Column('message', sa.Text(), nullable=False), sa.Column('consent', sa.Boolean(), nullable=False), sa.Column('status', sa.String(30), nullable=False, server_default='new'),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')), sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_leads_reference_no','leads',['reference_no']); op.create_index('ix_leads_project_id','leads',['project_id']); op.create_index('ix_leads_email','leads',['email']); op.create_index('ix_leads_status','leads',['status']); op.create_index('ix_leads_assigned_to','leads',['assigned_to']); op.create_index('ix_leads_status_created_desc','leads',['status',sa.text('created_at DESC')])

    op.create_table('lead_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('staff_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')), sa.Column('note', sa.Text(), nullable=False), sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_lead_notes_lead_id','lead_notes',['lead_id'])

    op.create_table('site_settings',
        sa.Column('key', sa.String(120), primary_key=True), sa.Column('value_json', sa.JSON(), nullable=False), sa.Column('updated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))

    op.create_table('audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True), sa.Column('actor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('profiles.id', ondelete='SET NULL')),
        sa.Column('action', sa.String(120), nullable=False), sa.Column('entity_type', sa.String(80), nullable=False), sa.Column('entity_id', postgresql.UUID(as_uuid=True)), sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_audit_log_actor_id','audit_log',['actor_id']); op.create_index('ix_audit_log_action','audit_log',['action']); op.create_index('ix_audit_log_entity_type','audit_log',['entity_type']); op.create_index('ix_audit_log_entity_id','audit_log',['entity_id']); op.create_index('ix_audit_log_created_at','audit_log',['created_at'])


def downgrade():
    for table in ['audit_log','site_settings','lead_notes','leads','staff_roles','news_article_categories','news_articles','news_categories','business_areas','project_media','projects','profiles']:
        op.drop_table(table)
