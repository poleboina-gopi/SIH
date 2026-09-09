import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "legal_metrology_secret_key_2024";

/**
 * Middleware: Verify JWT Authentication Token
 */
export function authenticateToken(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ 
      error: "Authentication required. Please sign in with your official officer account." 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ 
        error: "Session expired or invalid authorization token. Please sign in again." 
      });
    }

    req.user = decodedUser;
    next();
  });
}

/**
 * Middleware: Enforce Role-Based Access Control
 * @param {...string} allowedRoles - 'inspector', 'admin'
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required before accessing this statutory endpoint." 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (allowedRoles.includes('inspector')) {
        return res.status(403).json({ 
          error: "Access Denied: Only sworn Legal Metrology Inspectors have statutory authority to upload, scan, and inspect packaging commodities." 
        });
      }

      if (allowedRoles.includes('admin')) {
        return res.status(403).json({ 
          error: "Access Denied: Joint Controller / Administrator clearance required to access system analytics, rule controls, or user administration." 
        });
      }

      return res.status(403).json({ 
        error: "Access Denied: Your account role does not have authorization to perform this operation." 
      });
    }

    next();
  };
}

export const requireInspector = requireRole('inspector');
export const requireAdmin = requireRole('admin');
