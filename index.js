import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckSquare, Target, TrendingUp, BookOpen, Plus, X, Edit2, Save, Trash2, Sparkles, Flame, Star } from 'lucide-react';

const STORAGE_PREFIX = 'progress-planner:';

const createMemoryStorage = () => {
  const store = new Map();
  return {
    async get(key) {
      const value = store.get(key) ?? null;
      return value ? { value } : null;
    },
    async set(key, value) {
      store.set(key, value);
    }
  };
};

const createStorage = () => {
  if (typeof window === 'undefined') {
    return createMemoryStorage();
  }

  const canUseLocalStorage = (() => {
    try {
      const testKey = `${STORAGE_PREFIX}__test__`;
      window.localStorage.setItem(testKey, 'ok');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('LocalStorage unavailable, falling back to memory storage.', error);
      return false;
    }
  })();

  if (!canUseLocalStorage) {
    return createMemoryStorage();
  }

  return {
    async get(key) {
      const value = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return value !== null ? { value } : null;
    },
    async set(key, value) {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    }
  };
};

const storage = createStorage();

if (typeof window !== 'undefined') {
  window.storage = storage;
  registerServiceWorker();
}

function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(error => console.error('Service worker registration failed:', error));
  });
}

const ProgressPlannerApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weeklyActivities, setWeeklyActivities] = useState(['SM', 'Namaz', 'Quran', 'Book', 'Typing', 'Course Work']);
  const [weeklyData, setWeeklyData] = useState({});
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekKey());
  const [goals, setGoals] = useState({ yearly: [], monthly: [], weekly: [] });
  const [habits, setHabits] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [journal, setJournal] = useState([]);
  const [newActivity, setNewActivity] = useState('');
  const [editingActivity, setEditingActivity] = useState(null);
  const [newGoalInputs, setNewGoalInputs] = useState({ yearly: '', monthly: '', weekly: '' });
  const [newHabit, setNewHabit] = useState('');
  const [newTaskInputs, setNewTaskInputs] = useState({ daily: '', pending: '' });
  const [journalEntry, setJournalEntry] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const inviteMessageTimeout = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [weeklyActivities, weeklyData, goals, habits, dailyTasks, pendingTasks, journal]);

  useEffect(() => {
    return () => {
      if (inviteMessageTimeout.current) {
        clearTimeout(inviteMessageTimeout.current);
      }
    };
  }, []);

  async function loadData() {
    try {
      const [
        activitiesRes,
        weeklyRes,
        goalsRes,
        habitsRes,
        legacyTasksRes,
        journalRes,
        dailyTasksRes,
        pendingTasksRes
      ] = await Promise.all([
        window.storage.get('activities').catch(() => null),
        window.storage.get('weeklyData').catch(() => null),
        window.storage.get('goals').catch(() => null),
        window.storage.get('habits').catch(() => null),
        window.storage.get('tasks').catch(() => null),
        window.storage.get('journal').catch(() => null),
        window.storage.get('dailyTasks').catch(() => null),
        window.storage.get('pendingTasks').catch(() => null)
      ]);

      if (activitiesRes) setWeeklyActivities(JSON.parse(activitiesRes.value));
      if (weeklyRes) setWeeklyData(JSON.parse(weeklyRes.value));
      if (goalsRes) setGoals(JSON.parse(goalsRes.value));
      if (habitsRes) setHabits(JSON.parse(habitsRes.value));
      if (dailyTasksRes) {
        setDailyTasks(JSON.parse(dailyTasksRes.value));
      } else if (legacyTasksRes) {
        setDailyTasks(JSON.parse(legacyTasksRes.value));
      }
      if (pendingTasksRes) setPendingTasks(JSON.parse(pendingTasksRes.value));
      if (journalRes) setJournal(JSON.parse(journalRes.value));
    } catch (error) {
      console.log('First time loading, using defaults');
    }
  }

  async function saveData() {
    try {
      await Promise.all([
        window.storage.set('activities', JSON.stringify(weeklyActivities)),
        window.storage.set('weeklyData', JSON.stringify(weeklyData)),
        window.storage.set('goals', JSON.stringify(goals)),
        window.storage.set('habits', JSON.stringify(habits)),
        window.storage.set('dailyTasks', JSON.stringify(dailyTasks)),
        window.storage.set('pendingTasks', JSON.stringify(pendingTasks)),
        window.storage.set('journal', JSON.stringify(journal))
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  function getCurrentWeekKey() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return startOfWeek.toISOString().split('T')[0];
  }

  function getWeekDates(weekKey) {
    const start = new Date(weekKey);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  function toggleActivity(date, activity) {
    const dateKey = date.toISOString().split('T')[0];
    setWeeklyData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [activity]: !prev[dateKey]?.[activity]
      }
    }));
  }

  function addActivity() {
    if (newActivity.trim()) {
      setWeeklyActivities([...weeklyActivities, newActivity.trim()]);
      setNewActivity('');
    }
  }

  function removeActivity(activity) {
    setWeeklyActivities(weeklyActivities.filter(a => a !== activity));
  }

  function updateActivity(oldName, newName) {
    if (newName.trim()) {
      setWeeklyActivities(weeklyActivities.map(a => a === oldName ? newName.trim() : a));
      setEditingActivity(null);
    }
  }

  function addGoal(type) {
    const goalText = newGoalInputs[type]?.trim();
    if (!goalText) {
      return;
    }
    setGoals({
      ...goals,
      [type]: [...goals[type], { id: Date.now(), text: goalText, completed: false }]
    });
    setNewGoalInputs(prev => ({ ...prev, [type]: '' }));
  }

  function toggleGoal(type, id) {
    setGoals({
      ...goals,
      [type]: goals[type].map(g => g.id === id ? { ...g, completed: !g.completed } : g)
    });
  }

  function deleteGoal(type, id) {
    setGoals({
      ...goals,
      [type]: goals[type].filter(g => g.id !== id)
    });
  }

  function addHabit() {
    if (newHabit.trim()) {
      setHabits([...habits, { id: Date.now(), name: newHabit.trim(), streak: 0, lastDone: null }]);
      setNewHabit('');
    }
  }

  function trackHabit(id) {
    const today = new Date().toISOString().split('T')[0];
    setHabits(habits.map(h => {
      if (h.id === id) {
        if (h.lastDone === today) {
          return { ...h, streak: Math.max(0, h.streak - 1), lastDone: null };
        } else {
          return { ...h, streak: h.streak + 1, lastDone: today };
        }
      }
      return h;
    }));
  }

  function deleteHabit(id) {
    setHabits(habits.filter(h => h.id !== id));
  }

  function updateTasksByType(type, updater) {
    if (type === 'pending') {
      setPendingTasks(prev => updater(prev));
    } else {
      setDailyTasks(prev => updater(prev));
    }
  }

  function getTasksByType(type) {
    return type === 'pending' ? pendingTasks : dailyTasks;
  }

  function addTask(type) {
    const taskText = newTaskInputs[type]?.trim();
    if (!taskText) {
      return;
    }
    updateTasksByType(type, prev => [...prev, { id: Date.now(), text: taskText, completed: false, priority: false }]);
    setNewTaskInputs(prev => ({ ...prev, [type]: '' }));
  }

  function toggleTask(type, id) {
    updateTasksByType(type, prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function togglePriority(type, id) {
    updateTasksByType(type, prev => prev.map(t => (t.id === id ? { ...t, priority: !t.priority } : t)));
  }

  function deleteTask(type, id) {
    updateTasksByType(type, prev => prev.filter(t => t.id !== id));
  }

  function addJournalEntry() {
    if (journalEntry.trim()) {
      setJournal([{ id: Date.now(), date: new Date().toISOString(), text: journalEntry.trim() }, ...journal]);
      setJournalEntry('');
    }
  }

  function deleteJournalEntry(id) {
    setJournal(journal.filter(j => j.id !== id));
  }

  function setTimedInviteMessage(message) {
    setInviteMessage(message);
    if (inviteMessageTimeout.current) {
      clearTimeout(inviteMessageTimeout.current);
    }
    inviteMessageTimeout.current = setTimeout(() => setInviteMessage(''), 4000);
  }

  async function handleInviteFriends() {
    if (typeof window === 'undefined') {
      return;
    }

    const inviteUrl = window.location.href;
    const sharePayload = {
      title: 'Progress Hub',
      text: 'Join me in tracking goals and habits with Progress Hub!',
      url: inviteUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        setTimedInviteMessage('Invite sent via your share sheet.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
        setTimedInviteMessage('Link copied to clipboard. Share it with anyone!');
        return;
      }
    } catch (error) {
      console.error('Invite failed:', error);
    }

    window.prompt('Copy this invite link and share it with friends:', inviteUrl);
    setTimedInviteMessage('Copy the link and share it manually.');
  }

  function calculateWeeklyCompletion() {
    const weekDates = getWeekDates(currentWeek);
    let total = 0;
    let completed = 0;
    
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];
      weeklyActivities.forEach(activity => {
        total++;
        if (weeklyData[dateKey]?.[activity]) completed++;
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  const weekDates = getWeekDates(currentWeek);
  const weeklyCompletion = calculateWeeklyCompletion();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const tabColors = {
    dashboard: 'from-violet-500 to-purple-600',
    weekly: 'from-blue-500 to-cyan-600',
    goals: 'from-emerald-500 to-teal-600',
    habits: 'from-orange-500 to-red-600',
    tasks: 'from-pink-500 to-rose-600',
    journal: 'from-amber-500 to-yellow-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      

      <div className="relative max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg transform hover:scale-110 transition-transform">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-violet-700 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-3">
              Progress Hub
            </h1>
          </div>
          <p className="text-gray-600 text-lg font-medium">Your journey to greatness starts here</p>
          <div className="flex flex-col items-center gap-2 mt-4">
            <button
              onClick={handleInviteFriends}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 bg-white text-purple-600 shadow-lg border border-purple-200"
            >
              <Star className="text-purple-500" size={20} />
              Invite friends
            </button>
            {inviteMessage && <p className="text-sm text-gray-500">{inviteMessage}</p>}
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 justify-center flex-wrap">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Dashboard', emoji: '📊' },
            { id: 'weekly', icon: Calendar, label: 'Weekly', emoji: '📅' },
            { id: 'goals', icon: Target, label: 'Goals', emoji: '🎯' },
            { id: 'habits', icon: Flame, label: 'Habits', emoji: '🔥' },
            { id: 'tasks', icon: CheckSquare, label: 'Tasks', emoji: '✅' },
            { id: 'journal', icon: BookOpen, label: 'Journal', emoji: '📖' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap shadow-lg ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tabColors[tab.id]} text-white shadow-2xl scale-105`
                  : 'bg-white text-gray-600 hover:shadow-xl'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-8 rounded-3xl shadow-2xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp size={28} />
                  </div>
                  <h3 className="text-xl font-bold">Weekly Progress</h3>
                </div>
                <div className="text-6xl font-black mb-2">{weeklyCompletion}%</div>
                <p className="text-violet-100">Keep crushing it!</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-3xl shadow-2xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Flame size={28} />
                  </div>
                  <h3 className="text-xl font-bold">Active Habits</h3>
                </div>
                <div className="text-6xl font-black mb-2">{habits.length}</div>
                <p className="text-orange-100">Habits being tracked</p>
              </div>
              
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-3xl shadow-2xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CheckSquare size={28} />
                  </div>
                  <h3 className="text-xl font-bold">Pending Tasks</h3>
                </div>
                <div className="text-6xl font-black mb-2">{pendingTasks.filter(t => !t.completed).length}</div>
                <p className="text-pink-100">Lets get them done!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="text-purple-600" size={28} />
                  <h3 className="text-2xl font-black text-gray-800">Goals Overview</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <span className="text-2xl">🎯</span> Yearly Goals
                      </h4>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                        {goals.yearly.filter(g => g.completed).length}/{goals.yearly.length}
                      </span>
                    </div>
                    {goals.yearly.slice(0, 3).map(goal => (
                      <div key={goal.id} className={`flex items-center gap-2 mb-2 ${goal.completed ? 'text-gray-400' : 'text-gray-700'}`}>
                        <span className="text-lg">{goal.completed ? '✅' : '⭕'}</span>
                        <span className={goal.completed ? 'line-through' : ''}>{goal.text}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <span className="text-2xl">📅</span> Monthly Goals
                      </h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                        {goals.monthly.filter(g => g.completed).length}/{goals.monthly.length}
                      </span>
                    </div>
                    {goals.monthly.slice(0, 3).map(goal => (
                      <div key={goal.id} className={`flex items-center gap-2 mb-2 ${goal.completed ? 'text-gray-400' : 'text-gray-700'}`}>
                        <span className="text-lg">{goal.completed ? '✅' : '⭕'}</span>
                        <span className={goal.completed ? 'line-through' : ''}>{goal.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-6">
                  <Flame className="text-orange-600" size={28} />
                  <h3 className="text-2xl font-black text-gray-800">Top Habits</h3>
                </div>
                <div className="space-y-4">
                  {habits.slice(0, 4).map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200">
                      <span className="font-bold text-gray-700">{habit.name}</span>
                      <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-black">
                        {habit.streak} 🔥
                      </span>
                    </div>
                  ))}
                  {habits.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Flame size={48} className="mx-auto mb-2 opacity-30" />
                      <p>Start tracking habits!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-blue-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <span className="text-4xl">📅</span> Weekly Tracker
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const prevWeek = new Date(currentWeek);
                    prevWeek.setDate(prevWeek.getDate() - 7);
                    setCurrentWeek(prevWeek.toISOString().split('T')[0]);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentWeek(getCurrentWeekKey())}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    const nextWeek = new Date(currentWeek);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setCurrentWeek(nextWeek.toISOString().split('T')[0]);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="mb-6 flex gap-3">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                placeholder="Add new activity..."
                className="flex-1 px-6 py-4 border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium text-gray-700"
              />
              <button
                onClick={addActivity}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Add
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <th className="border-2 border-blue-300 p-4 text-left font-black text-lg">Date / Day</th>
                    {weeklyActivities.map((activity, idx) => (
                      <th key={idx} className="border-2 border-blue-300 p-4 text-center font-black text-lg min-w-[120px]">
                        {editingActivity === activity ? (
                          <input
                            type="text"
                            defaultValue={activity}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') updateActivity(activity, e.target.value);
                            }}
                            onBlur={(e) => updateActivity(activity, e.target.value)}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm text-gray-700"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>{activity}</span>
                            <button onClick={() => setEditingActivity(activity)} className="text-blue-100 hover:text-white">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => removeActivity(activity)} className="text-blue-100 hover:text-white">
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekDates.map((date, idx) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const isToday = dateKey === new Date().toISOString().split('T')[0];
                    return (
                      <tr key={idx} className={`${isToday ? 'bg-yellow-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                        <td className="border-2 border-blue-200 p-4 font-bold text-gray-700">
                          <div className="flex items-center gap-3">
                            {isToday && <span className="text-2xl">👉</span>}
                            <div>
                              <div className="text-lg">{date.getDate()}-{date.toLocaleString('default', { month: 'short' })}</div>
                              <div className="text-sm text-gray-500 font-medium">{dayNames[date.getDay()]}</div>
                            </div>
                          </div>
                        </td>
                        {weeklyActivities.map((activity, actIdx) => (
                          <td key={actIdx} className="border-2 border-blue-200 p-4 text-center">
                            <button
                              onClick={() => toggleActivity(date, activity)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all transform hover:scale-110 font-bold text-xl shadow-md ${
                                weeklyData[dateKey]?.[activity]
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg scale-110'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                              }`}
                            >
                              {weeklyData[dateKey]?.[activity] && '✓'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg">
                <span className="text-lg font-medium">Weekly Completion: </span>
                <span className="font-black text-3xl ml-2">{weeklyCompletion}%</span>
                <span className="ml-2 text-2xl">
                  {weeklyCompletion >= 80 ? '🔥' : weeklyCompletion >= 50 ? '💪' : '📈'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            {[
              { type: 'yearly', color: 'from-purple-500 to-violet-600', emoji: '🎯', title: 'Yearly Goals' },
              { type: 'monthly', color: 'from-blue-500 to-cyan-600', emoji: '📅', title: 'Monthly Goals' },
              { type: 'weekly', color: 'from-emerald-500 to-teal-600', emoji: '📝', title: 'Weekly Goals' }
            ].map(({ type, color, emoji, title }) => (
              <div key={type} className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-purple-200">
                <h3 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                  <span className="text-4xl">{emoji}</span> {title}
                </h3>
                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={newGoalInputs[type] ?? ''}
                    onChange={(e) => setNewGoalInputs(prev => ({ ...prev, [type]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addGoal(type)}
                    placeholder={`Add ${type} goal...`}
                    className="flex-1 px-6 py-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 font-medium"
                  />
                  <button
                    onClick={() => addGoal(type)}
                    className={`px-8 py-4 bg-gradient-to-r ${color} text-white rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {goals[type].map(goal => (
                    <div key={goal.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                      goal.completed 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg'
                    }`}>
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => toggleGoal(type, goal.id)}
                        className="w-7 h-7 text-purple-600 rounded-lg cursor-pointer"
                      />
                      <span className={`flex-1 text-lg font-medium ${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {goal.text}
                      </span>
                      {goal.completed && <span className="text-2xl">✨</span>}
                      <button
                        onClick={() => deleteGoal(type, goal.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  {goals[type].length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Target size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No {type} goals yet. Start setting some!</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-orange-200">
            <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-4xl">🔥</span> Habit Tracker
            </h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Add new habit..."
                className="flex-1 px-6 py-4 border-2 border-orange-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-300 font-medium"
              />
              <button
                onClick={addHabit}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="grid gap-4">
              {habits.map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const doneToday = habit.lastDone === today;
                return (
                  <div key={habit.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200 hover:shadow-lg transition-all">
                    <div>
                      <h4 className="font-black text-xl text-gray-800">{habit.name}</h4>
                      <p className="text-sm text-gray-600 font-medium mt-1">
                        {habit.streak > 0 ? `${habit.streak} day streak 🔥` : 'Start your streak today!'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => trackHabit(habit.id)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                          doneToday
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
                        }`}
                      >
                        {doneToday ? '✓ Done Today' : 'Mark Done'}
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-red-500 hover:text-red-700 p-3 hover:bg-red-100 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {habits.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Flame size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-medium">No habits yet. Add one above to start your journey!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid gap-8 lg:grid-cols-2">
            {[
              {
                type: 'daily',
                title: 'Daily Tasks',
                emoji: '✅',
                border: 'border-pink-200',
                gradient: 'from-pink-500 to-rose-500',
                emptyIcon: CheckSquare,
                priorityBg: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300',
                normalBg: 'bg-gradient-to-r from-purple-50 to-pink-50 border-pink-200'
              },
              {
                type: 'pending',
                title: 'Pending Tasks',
                emoji: '⏳',
                border: 'border-indigo-200',
                gradient: 'from-purple-500 to-indigo-500',
                emptyIcon: Target,
                priorityBg: 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300',
                normalBg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-200'
              }
            ].map(section => {
              const tasksForType = getTasksByType(section.type).sort(
                (a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0)
              );
              const EmptyIcon = section.emptyIcon;
              return (
                <div
                  key={section.type}
                  className={`bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 ${section.border}`}
                >
                  <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                    <span className="text-4xl">{section.emoji}</span> {section.title}
                  </h2>
                  <div className="flex gap-3 mb-6">
                    <input
                      type="text"
                      value={newTaskInputs[section.type] ?? ''}
                      onChange={(e) =>
                        setNewTaskInputs(prev => ({ ...prev, [section.type]: e.target.value }))
                      }
                      onKeyPress={(e) => e.key === 'Enter' && addTask(section.type)}
                      placeholder={`Add ${section.type} task...`}
                      className="flex-1 px-6 py-4 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 font-medium"
                    />
                    <button
                      onClick={() => addTask(section.type)}
                      className={`px-8 py-4 bg-gradient-to-r ${section.gradient} text-white rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all`}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tasksForType.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                          task.priority ? section.priorityBg : section.normalBg
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(section.type, task.id)}
                          className="w-7 h-7 text-pink-600 rounded-lg cursor-pointer"
                        />
                        <span className={`flex-1 text-lg font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {task.text}
                        </span>
                        {task.completed && <span className="text-2xl">🎉</span>}
                        <button
                          onClick={() => togglePriority(section.type, task.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            task.priority
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {task.priority ? '⭐ Priority' : 'Normal'}
                        </button>
                        <button
                          onClick={() => deleteTask(section.type, task.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {tasksForType.length === 0 && (
                      <div className="text-center py-16 text-gray-400">
                        <EmptyIcon size={64} className="mx-auto mb-4 opacity-30" />
                        <p className="text-xl font-medium">
                          No {section.type} tasks yet. Add one above to get started!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-yellow-200">
            <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-4xl">📖</span> Journal & Notes
            </h2>
            <div className="mb-8">
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Write your thoughts, reflections, or things to remember..."
                className="w-full px-6 py-4 border-2 border-yellow-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300 min-h-[150px] font-medium text-gray-700"
              />
              <button
                onClick={addJournalEntry}
                className="mt-4 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <Save size={20} /> Save Entry
              </button>
            </div>
            <div className="space-y-4">
              {journal.map(entry => {
                const date = new Date(entry.date);
                return (
                  <div key={entry.id} className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-yellow-200 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-bold text-gray-600">
                        {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">{entry.text}</p>
                  </div>
                );
              })}
              {journal.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <BookOpen size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-medium">No journal entries yet. Start writing above!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPlannerApp;