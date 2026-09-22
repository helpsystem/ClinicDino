import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { clinics, doctors, leaderboardEntries } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { getOrCreateUser } from './src/db/users.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // 1. Get Clinic by Slug (Public for game launch)
  app.get('/api/clinics/slug/:slug', async (req, res) => {
    try {
      const clinic = await db.select().from(clinics).where(eq(clinics.slug, req.params.slug)).limit(1);
      if (!clinic[0]) {
        return res.status(404).json({ error: 'Clinic not found' });
      }
      res.json(clinic[0]);
    } catch (err: any) {
      console.error("DB Error fetching clinic by slug:", err);
      res.status(500).json({ error: "Failed to fetch clinic. Please try again later.", cause: err.message });
    }
  });

  // 2. Get Doctors by Clinic ID (Public for character select)
  app.get('/api/clinics/:clinicId/doctors', async (req, res) => {
    try {
      const docs = await db.select().from(doctors).where(eq(doctors.clinicId, req.params.clinicId as any));
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch doctors", cause: err.message });
    }
  });

  // 3. Post Score (Public for players)
  app.post('/api/leaderboard', async (req, res) => {
    try {
      const { clinicId, doctorId, playerName, score, selfieUrl } = req.body;
      const entry = await db.insert(leaderboardEntries).values({
        clinicId,
        doctorId: doctorId || null,
        playerName,
        score,
        selfieUrl,
      }).returning();
      res.json(entry[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save score", cause: err.message });
    }
  });

  // 4. Get Leaderboard (Public)
  app.get('/api/clinics/:clinicId/leaderboard', async (req, res) => {
    try {
      const topScores = await db.select().from(leaderboardEntries)
        .where(eq(leaderboardEntries.clinicId, req.params.clinicId as any))
        .orderBy(desc(leaderboardEntries.score))
        .limit(50);
      res.json(topScores);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch leaderboard", cause: err.message });
    }
  });

  // Protected Admin Routes
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || '');
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: "Auth sync failed", cause: err.message });
    }
  });

  app.post('/api/admin/clinics', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, slug, primaryColor } = req.body;
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || '');
      const clinic = await db.insert(clinics).values({ name, slug, primaryColor }).returning();
      
      // Update the user's clinic ID
      const { users } = await import('./src/db/schema.ts');
      await db.update(users).set({ clinicId: clinic[0].id }).where(eq(users.id, user.id));
      
      res.json(clinic[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create clinic", cause: err.message });
    }
  });

  // Admin middleware to ensure they have a clinic
  const requireClinic = async (req: AuthRequest, res: any, next: any) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || '');
      if (!user.clinicId) return res.status(403).json({ error: "User has no clinic assigned" });
      (req as any).clinicId = user.clinicId;
      next();
    } catch (e) {
      res.status(500).json({ error: "Internal error" });
    }
  };

  app.get('/api/admin/my-clinic', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      const clinic = await db.select().from(clinics).where(eq(clinics.id, (req as any).clinicId)).limit(1);
      res.json(clinic[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch clinic" });
    }
  });

  app.put('/api/admin/my-clinic', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      const { name, slug, primaryColor, rewardText, gameAssets } = req.body;
      const clinic = await db.update(clinics).set({ name, slug, primaryColor, rewardText, gameAssets }).where(eq(clinics.id, (req as any).clinicId)).returning();
      res.json(clinic[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update clinic" });
    }
  });

  app.get('/api/admin/doctors', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      const docs = await db.select().from(doctors).where(eq(doctors.clinicId, (req as any).clinicId));
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  app.post('/api/admin/doctors', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      const { name, title, avatarUrl } = req.body;
      const doc = await db.insert(doctors).values({ clinicId: (req as any).clinicId, name, title, avatarUrl }).returning();
      res.json(doc[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to add doctor" });
    }
  });

  app.put('/api/admin/doctors/:id/toggle', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      const { isActive } = req.body;
      const doc = await db.update(doctors).set({ isActive }).where(eq(doctors.id, req.params.id as any)).returning();
      res.json(doc[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update doctor" });
    }
  });

  app.get('/api/admin/leaderboard', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      const topScores = await db.select().from(leaderboardEntries)
        .where(eq(leaderboardEntries.clinicId, (req as any).clinicId))
        .orderBy(desc(leaderboardEntries.score))
        .limit(100);
      res.json(topScores);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.delete('/api/admin/leaderboard/:id', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      await db.delete(leaderboardEntries).where(eq(leaderboardEntries.id, req.params.id as any));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete score" });
    }
  });

  app.delete('/api/admin/leaderboard-reset', requireAuth, requireClinic, async (req: AuthRequest, res) => {
    try {
      await db.delete(leaderboardEntries).where(eq(leaderboardEntries.clinicId, (req as any).clinicId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset leaderboard" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
