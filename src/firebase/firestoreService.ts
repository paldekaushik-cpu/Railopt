import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { MaintenanceTask, Train, BlockWindow, BlockPlan, Asset, AiRecommendation } from '../types';
import {
  INITIAL_TASKS,
  INITIAL_TRAINS,
  INITIAL_BLOCK_WINDOWS,
  INITIAL_BLOCK_PLANS,
  INITIAL_ASSETS,
  INITIAL_RECOMMENDATIONS
} from '../data/simulatedData';

const TASKS_COLL = 'maintenanceTasks';
const TRAINS_COLL = 'trains';
const WINDOWS_COLL = 'blockWindows';
const PLANS_COLL = 'blockPlans';
const ASSETS_COLL = 'assets';
const RECS_COLL = 'aiRecommendations';

export const firestoreService = {
  // Check if collections are empty; if so, seed with realistic simulated railway data
  async seedInitialDataIfNeeded(): Promise<boolean> {
    try {
      const snapshot = await getDocs(collection(db, TASKS_COLL));
      if (!snapshot.empty) {
        return false; // Already populated
      }
      await this.forceSeedData();
      return true;
    } catch (error) {
      console.warn('Checking seed data:', error);
      return false;
    }
  },

  // Reset and populate demo data
  async forceSeedData(): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Tasks
      INITIAL_TASKS.forEach(task => {
        const taskRef = doc(db, TASKS_COLL, task.taskId);
        batch.set(taskRef, task);
      });

      // Trains
      INITIAL_TRAINS.forEach(train => {
        const trainRef = doc(db, TRAINS_COLL, `${train.trainId}_${train.section}`);
        batch.set(trainRef, train);
      });

      // Windows
      INITIAL_BLOCK_WINDOWS.forEach(win => {
        const winRef = doc(db, WINDOWS_COLL, win.blockId);
        batch.set(winRef, win);
      });

      // Plans
      INITIAL_BLOCK_PLANS.forEach(plan => {
        const planRef = doc(db, PLANS_COLL, plan.planId);
        batch.set(planRef, plan);
      });

      // Assets
      INITIAL_ASSETS.forEach(asset => {
        const assetRef = doc(db, ASSETS_COLL, asset.assetId);
        batch.set(assetRef, asset);
      });

      // Recommendations
      INITIAL_RECOMMENDATIONS.forEach(rec => {
        const recRef = doc(db, RECS_COLL, rec.recommendationId);
        batch.set(recRef, rec);
      });

      await batch.commit();
      console.log('Seed data successfully committed to Cloud Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
    }
  },

  // --- Real-Time Listeners ---
  subscribeTasks(callback: (tasks: MaintenanceTask[]) => void, onError?: (err: unknown) => void) {
    return onSnapshot(
      collection(db, TASKS_COLL),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_TASKS);
          return;
        }
        const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceTask));
        callback(tasks);
      },
      (error) => {
        console.warn('Tasks subscription notice:', error);
        if (onError) onError(error);
        callback(INITIAL_TASKS);
      }
    );
  },

  subscribeTrains(callback: (trains: Train[]) => void) {
    return onSnapshot(
      collection(db, TRAINS_COLL),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_TRAINS);
          return;
        }
        const trains = snap.docs.map(d => ({ id: d.id, ...d.data() } as Train));
        callback(trains);
      },
      (error) => {
        console.warn('Trains subscription notice:', error);
        callback(INITIAL_TRAINS);
      }
    );
  },

  subscribeBlockWindows(callback: (windows: BlockWindow[]) => void) {
    return onSnapshot(
      collection(db, WINDOWS_COLL),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_BLOCK_WINDOWS);
          return;
        }
        const windows = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlockWindow));
        callback(windows);
      },
      (error) => {
        console.warn('Windows subscription notice:', error);
        callback(INITIAL_BLOCK_WINDOWS);
      }
    );
  },

  subscribeBlockPlans(callback: (plans: BlockPlan[]) => void) {
    return onSnapshot(
      collection(db, PLANS_COLL),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_BLOCK_PLANS);
          return;
        }
        const plans = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlockPlan));
        callback(plans);
      },
      (error) => {
        console.warn('Block plans subscription notice:', error);
        callback(INITIAL_BLOCK_PLANS);
      }
    );
  },

  subscribeAssets(callback: (assets: Asset[]) => void) {
    return onSnapshot(
      collection(db, ASSETS_COLL),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_ASSETS);
          return;
        }
        const assets = snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
        callback(assets);
      },
      (error) => {
        console.warn('Assets subscription notice:', error);
        callback(INITIAL_ASSETS);
      }
    );
  },

  subscribeRecommendations(callback: (recs: AiRecommendation[]) => void) {
    return onSnapshot(
      collection(db, RECS_COLL),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_RECOMMENDATIONS);
          return;
        }
        const recs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AiRecommendation));
        callback(recs);
      },
      (error) => {
        console.warn('Recommendations subscription notice:', error);
        callback(INITIAL_RECOMMENDATIONS);
      }
    );
  },

  // --- Task Operations ---
  async addTask(task: MaintenanceTask): Promise<void> {
    try {
      await setDoc(doc(db, TASKS_COLL, task.taskId), task);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${TASKS_COLL}/${task.taskId}`);
    }
  },

  async updateTask(taskId: string, updates: Partial<MaintenanceTask>): Promise<void> {
    try {
      await updateDoc(doc(db, TASKS_COLL, taskId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${TASKS_COLL}/${taskId}`);
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TASKS_COLL, taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${TASKS_COLL}/${taskId}`);
    }
  },

  // --- Block Plan Operations ---
  async saveBlockPlan(plan: BlockPlan): Promise<void> {
    try {
      await setDoc(doc(db, PLANS_COLL, plan.planId), plan);

      // Also update task statuses in batch
      if (plan.taskIds && plan.taskIds.length > 0) {
        const batch = writeBatch(db);
        for (const tid of plan.taskIds) {
          const taskRef = doc(db, TASKS_COLL, tid);
          batch.update(taskRef, {
            status: 'Bundled',
            assignedBlockId: plan.planId
          });
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${PLANS_COLL}/${plan.planId}`);
    }
  },

  async updateBlockPlan(planId: string, updates: Partial<BlockPlan>): Promise<void> {
    try {
      await updateDoc(doc(db, PLANS_COLL, planId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${PLANS_COLL}/${planId}`);
    }
  },

  // --- AI Recommendations Operations ---
  async applyRecommendation(recommendation: AiRecommendation): Promise<void> {
    try {
      // 1. Mark recommendation as Applied
      await updateDoc(doc(db, RECS_COLL, recommendation.recommendationId), {
        status: 'Applied'
      });

      // 2. Create or update relevant block plan in Firestore
      const times = recommendation.recommendedTime.split('–');
      const start = times[0]?.trim() || '10:00';
      const end = times[1]?.trim() || '12:00';

      const planId = `BP-${recommendation.section}-${recommendation.recommendationId}`;
      const newPlan: BlockPlan = {
        planId,
        section: recommendation.section,
        date: new Date().toISOString().split('T')[0],
        startTime: start,
        endTime: end,
        taskIds: recommendation.taskIds,
        departments: ['Engineering', 'S&T', 'TRD'],
        trainConflicts: 0,
        conflictingTrainDetails: [],
        utilization: 95,
        assetAvailabilityImpact: 97.4,
        status: 'Scheduled',
        generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        bundlingDetails: {
          compatibleCount: recommendation.taskIds.length,
          explanation: recommendation.reason,
          departmentBreakdown: { Engineering: 1, 'S&T': 1, TRD: 1 }
        }
      };

      await this.saveBlockPlan(newPlan);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${RECS_COLL}/${recommendation.recommendationId}`);
    }
  },

  async dismissRecommendation(recommendationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, RECS_COLL, recommendationId), {
        status: 'Dismissed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${RECS_COLL}/${recommendationId}`);
    }
  }
};
