"""
Vault Role-Based Access Control (RBAC)
Enforces permissions across Owner, Admin, Auditor, and Viewer roles.
"""

from typing import Set, Dict

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "owner": {"audit:run", "audit:read", "pr:create", "team:manage", "keys:manage", "webhooks:manage", "billing:manage"},
    "admin": {"audit:run", "audit:read", "pr:create", "team:manage", "keys:manage", "webhooks:manage"},
    "auditor": {"audit:run", "audit:read", "pr:create"},
    "viewer": {"audit:read"}
}

class RbacValidator:
    @staticmethod
    def has_permission(role: str, permission: str) -> bool:
        allowed = ROLE_PERMISSIONS.get(role.lower(), set())
        return permission in allowed
