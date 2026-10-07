"""Initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. roles
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=64), nullable=False),
        sa.Column('department', sa.String(length=64), nullable=False),
        sa.Column('approval_limit', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('can_approve_disbursement', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('can_override_high_risk', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_auditor_read_only', sa.Boolean(), nullable=False, server_default='false'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. users
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('role_id', sa.String(length=32), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('organization', sa.String(length=128), nullable=False, server_default='Global Enterprise Corp'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)

    # 3. vendors
    op.create_table(
        'vendors',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('historical_min', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('historical_max', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('total_spend', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('invoice_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendors_id'), 'vendors', ['id'], unique=False)
    op.create_index(op.f('ix_vendors_name'), 'vendors', ['name'], unique=False)
    op.create_index(op.f('ix_vendors_category'), 'vendors', ['category'], unique=False)

    # 4. employees
    op.create_table(
        'employees',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('department', sa.String(length=64), nullable=False),
        sa.Column('typical_spend_limit', sa.Numeric(precision=15, scale=2), nullable=False, server_default='100000.00'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employees_id'), 'employees', ['id'], unique=False)
    op.create_index(op.f('ix_employees_department'), 'employees', ['department'], unique=False)

    # 5. rules
    op.create_table(
        'rules',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('score_contribution', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. invoices
    op.create_table(
        'invoices',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('invoice_id', sa.String(length=64), nullable=False),
        sa.Column('invoice_number', sa.String(length=64), nullable=True),
        sa.Column('employee_id', sa.String(length=32), nullable=True),
        sa.Column('employee_name', sa.String(length=128), nullable=True),
        sa.Column('employee_dept', sa.String(length=64), nullable=True),
        sa.Column('vendor_id', sa.String(length=32), nullable=True),
        sa.Column('vendor_name', sa.String(length=128), nullable=True),
        sa.Column('invoice_date', sa.DateTime(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('category', sa.String(length=64), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('approval_status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('receipt_status', sa.String(length=32), nullable=False, server_default='MISSING'),
        sa.Column('payment_status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('policy_category', sa.String(length=64), nullable=True, server_default='Standard'),
        sa.Column('risk_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('confidence', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('decision', sa.String(length=32), nullable=True),
        sa.Column('human_decision', sa.String(length=32), nullable=True),
        sa.Column('rules_triggered', sa.JSON(), nullable=True),
        sa.Column('anomaly_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_id')
    )
    op.create_index(op.f('ix_invoices_id'), 'invoices', ['id'], unique=False)
    op.create_index(op.f('ix_invoices_invoice_id'), 'invoices', ['invoice_id'], unique=True)
    op.create_index(op.f('ix_invoices_invoice_number'), 'invoices', ['invoice_number'], unique=False)
    op.create_index(op.f('ix_invoices_employee_id'), 'invoices', ['employee_id'], unique=False)
    op.create_index(op.f('ix_invoices_vendor_id'), 'invoices', ['vendor_id'], unique=False)
    op.create_index(op.f('ix_invoices_category'), 'invoices', ['category'], unique=False)
    op.create_index(op.f('ix_invoices_risk_score'), 'invoices', ['risk_score'], unique=False)
    op.create_index(op.f('ix_invoices_decision'), 'invoices', ['decision'], unique=False)
    op.create_index(op.f('ix_invoices_human_decision'), 'invoices', ['human_decision'], unique=False)

    # 7. invoice_items
    op.create_table(
        'invoice_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('invoice_id', sa.Uuid(), nullable=False),
        sa.Column('item_description', sa.Text(), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=False, server_default='1.00'),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoice_items_invoice_id'), 'invoice_items', ['invoice_id'], unique=False)

    # 8. risk_assessments
    op.create_table(
        'risk_assessments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('invoice_id', sa.Uuid(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('risk_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('confidence', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('decision', sa.String(length=32), nullable=False),
        sa.Column('validation_risk', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('duplicate_risk', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('behavioral_risk', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('policy_risk', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('relationship_risk', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('anomaly_model_risk', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_risk_assessments_invoice_id'), 'risk_assessments', ['invoice_id'], unique=False)

    # 9. exceptions
    op.create_table(
        'exceptions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('invoice_id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=True),
        sa.Column('rule_id', sa.String(length=64), nullable=True),
        sa.Column('exception_type', sa.String(length=32), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('severity_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('evidence_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assessment_id'], ['risk_assessments.id'], ),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exceptions_invoice_id'), 'exceptions', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_exceptions_assessment_id'), 'exceptions', ['assessment_id'], unique=False)
    op.create_index(op.f('ix_exceptions_rule_id'), 'exceptions', ['rule_id'], unique=False)

    # 10. evidence
    op.create_table(
        'evidence',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=False),
        sa.Column('behavioral_analysis', sa.JSON(), nullable=True),
        sa.Column('duplicate_evidence', sa.JSON(), nullable=True),
        sa.Column('relationship_flags', sa.JSON(), nullable=True),
        sa.Column('evidence_graph', sa.JSON(), nullable=True),
        sa.Column('counterfactual_steps', sa.JSON(), nullable=True),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assessment_id'], ['risk_assessments.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id')
    )

    # 11. audit_events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('transaction_id', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('event_data', sa.JSON(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('hash', sa.String(length=64), nullable=False),
        sa.Column('prev_hash', sa.String(length=64), nullable=False),
        sa.Column('block_index', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('block_index'),
        sa.UniqueConstraint('hash')
    )
    op.create_index(op.f('ix_audit_events_id'), 'audit_events', ['id'], unique=False)
    op.create_index(op.f('ix_audit_events_transaction_id'), 'audit_events', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_audit_events_event_type'), 'audit_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_audit_events_hash'), 'audit_events', ['hash'], unique=True)
    op.create_index(op.f('ix_audit_events_block_index'), 'audit_events', ['block_index'], unique=True)

    # 12. human_decisions
    op.create_table(
        'human_decisions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('decision_uuid', sa.Uuid(), nullable=True),
        sa.Column('invoice_id', sa.Uuid(), nullable=True),
        sa.Column('transaction_id', sa.String(length=64), nullable=True),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('reviewer_id', sa.String(length=128), nullable=True),
        sa.Column('reviewer_name', sa.String(length=128), nullable=True),
        sa.Column('reviewer_role', sa.String(length=64), nullable=True),
        sa.Column('decision', sa.String(length=32), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('original_decision', sa.String(length=32), nullable=True),
        sa.Column('audit_event_id', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['audit_event_id'], ['audit_events.id'], ),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_human_decisions_id'), 'human_decisions', ['id'], unique=False)
    op.create_index(op.f('ix_human_decisions_decision_uuid'), 'human_decisions', ['decision_uuid'], unique=False)
    op.create_index(op.f('ix_human_decisions_invoice_id'), 'human_decisions', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_human_decisions_transaction_id'), 'human_decisions', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_human_decisions_user_id'), 'human_decisions', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table('human_decisions')
    op.drop_table('audit_events')
    op.drop_table('evidence')
    op.drop_table('exceptions')
    op.drop_table('risk_assessments')
    op.drop_table('invoice_items')
    op.drop_table('invoices')
    op.drop_table('rules')
    op.drop_table('employees')
    op.drop_table('vendors')
    op.drop_table('users')
    op.drop_table('roles')
