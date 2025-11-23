import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckSquare, Target, TrendingUp, BookOpen, Plus, X, Edit2, Save, Trash2, Sparkles, Flame, Star } from 'lucide-react';

// Simple async localStorage wrapper used in place of non-standard `window.storage`
const storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (e) {
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }
};

function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

if (typeof window !== 'undefined') {
  registerServiceWorker();
}

const ProgressPlannerApp = () => {
  const PRIMARY = '#92487A';
  const SECONDARY = '#E49BA6';
  const GRADIENT = `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`;
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
        tasksRes,
        journalRes,
        dailyTasksRes,
        pendingTasksRes
      ] = await Promise.all([
        storage.get('activities'),
        storage.get('weeklyData'),
        storage.get('goals'),
        storage.get('habits'),
        storage.get('tasks'),
        storage.get('journal'),
        storage.get('dailyTasks'),
        storage.get('pendingTasks')
      ]);

      if (activitiesRes) setWeeklyActivities(JSON.parse(activitiesRes.value));
      if (weeklyRes) setWeeklyData(JSON.parse(weeklyRes.value));
      if (goalsRes) setGoals(JSON.parse(goalsRes.value));
      if (habitsRes) setHabits(JSON.parse(habitsRes.value));
      if (dailyTasksRes) {
        setDailyTasks(JSON.parse(dailyTasksRes.value));
      } else if (tasksRes) {
        setDailyTasks(JSON.parse(tasksRes.value));
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
        storage.set('activities', JSON.stringify(weeklyActivities)),
        storage.set('weeklyData', JSON.stringify(weeklyData)),
        storage.set('goals', JSON.stringify(goals)),
        storage.set('habits', JSON.stringify(habits)),
        storage.set('dailyTasks', JSON.stringify(dailyTasks)),
        storage.set('pendingTasks', JSON.stringify(pendingTasks)),
        storage.set('journal', JSON.stringify(journal))
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

  function setActivityState(date, activity, state) {
    const dateKey = date.toISOString().split('T')[0];
    setWeeklyData(prev => {
      const current = prev[dateKey]?.[activity];
      const next = current === state ? undefined : state;
      return {
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [activity]: next
        }
      };
    });
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
    const key = type === 'pending' ? 'pending' : 'daily';
    const text = newTaskInputs[key]?.trim();
    if (!text) {
      return;
    }
    updateTasksByType(type, prev => [...prev, { id: Date.now(), text, completed: false, priority: false }]);
    setNewTaskInputs(prev => ({ ...prev, [key]: '' }));
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
      text: 'Join me in tracking goals, habits, and tasks with Progress Hub!',
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
        setTimedInviteMessage('Link copied to clipboard!');
        return;
      }
    } catch (error) {
      console.error('Invite failed:', error);
    }

    window.prompt('Copy this invite link and share it manually:', inviteUrl);
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
        if (weeklyData[dateKey]?.[activity] === 'done') completed++;
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
    goals: 'from-green-500 to-emerald-600',
    habits: 'from-amber-500 to-orange-600',
    tasks: 'from-slate-500 to-gray-600',
    pending: 'from-indigo-500 to-sky-600',
    journal: 'from-yellow-500 to-amber-600'
  };

  return (
    <div className="min-h-screen relative overflow-visible" style={{
      background: `linear-gradient(135deg, #fef7ff 0%, #fef2f5 50%, #faf5ff 100%)`
    }}>
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob" style={{background: PRIMARY}}></div>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob animation-delay-2000" style={{background: SECONDARY}}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob animation-delay-4000" style={{background: PRIMARY}}></div>
      </div>
      
      {/* NOTE: For production stability and faster loading, 
        move this <style> block's content to your global CSS file (src/main.css).
      */}
      

      <div className="relative max-w-7xl mx-auto p-5 md:p-6 z-10">
        <div className="mb-8 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-6 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300" style={{
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
              boxShadow: `0 10px 30px rgba(146, 72, 122, 0.3)`
            }}>
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r" style={{
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.5
            }}>
              Progress Hub
            </h1>
          </div>
          <p className="text-gray-600 text-base md:text-lg font-medium mb-4">Your journey to greatness starts here</p>
          <div className="flex flex-col items-center gap-2 mt-4">
            <button
              onClick={handleInviteFriends}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl glass-card border-2"
              style={{
                borderColor: PRIMARY,
                color: PRIMARY
              }}
            >
              <Star size={20} />
              Invite friends
            </button>
            {inviteMessage && (
              <p className="text-sm text-gray-600 font-medium animate-slideIn bg-white/80 px-4 py-2 rounded-lg shadow-md">
                {inviteMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 md:gap-3 mb-8 overflow-x-auto p-2 justify-start md:justify-center flex-wrap animate-fadeIn">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Dashboard', emoji: '📊' },
            { id: 'weekly', icon: Calendar, label: 'Weekly', emoji: '📅' },
            { id: 'goals', icon: Target, label: 'Goals', emoji: '🎯' },
            { id: 'habits', icon: Flame, label: 'Habits', emoji: '🔥' },
            { id: 'tasks', icon: CheckSquare, label: 'Daily Tasks', emoji: '✅' },
            { id: 'pending', icon: Star, label: 'Pending Tasks', emoji: '⏳' },
            { id: 'journal', icon: BookOpen, label: 'Journal', emoji: '📖' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 md:gap-2 md:px-6 md:py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
                  isActive 
                    ? 'text-white shadow-2xl scale-105' 
                    : 'glass-card text-gray-700 hover:shadow-xl'
                }`}
                style={isActive ? {
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 8px 20px rgba(146, 72, 122, 0.3)`
                } : {
                  borderColor: `${PRIMARY}40`,
                  borderWidth: '2px'
                }}
              >
                <span className="text-base md:text-xl">{tab.emoji}</span>
                <span className="text-xs md:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div 
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 10px 30px rgba(146, 72, 122, 0.3)`
                }}
                className="p-6 rounded-3xl text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/25 rounded-xl backdrop-blur-sm shadow-lg">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-lg font-bold">Weekly Progress</h3>
                </div>
                <div className="text-4xl font-black mb-2">{weeklyCompletion}%</div>
                <p className="text-white/90 text-sm">Keep crushing it!</p>
              </div>
              
              <div 
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 10px 30px rgba(146, 72, 122, 0.3)`
                }}
                className="p-6 rounded-3xl text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/25 rounded-xl backdrop-blur-sm shadow-lg">
                    <Flame size={24} />
                  </div>
                  <h3 className="text-lg font-bold">Active Habits</h3>
                </div>
                <div className="text-4xl font-black mb-2">{habits.length}</div>
                <p className="text-white/90 text-sm">Habits being tracked</p>
              </div>
              
              <div 
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 10px 30px rgba(146, 72, 122, 0.3)`
                }}
                className="p-6 rounded-3xl text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/25 rounded-xl backdrop-blur-sm shadow-lg">
                    <CheckSquare size={24} />
                  </div>
                  <h3 className="text-lg font-bold">Pending Tasks</h3>
                </div>
                <div className="text-4xl font-black mb-2">{pendingTasks.filter(t => !t.completed).length}</div>
                <p className="text-white/90 text-sm">Lets get them done!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="glass-card p-6 rounded-3xl border-2 transition-all duration-300" style={{borderColor: `${PRIMARY}40`}}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl" style={{background: `${PRIMARY}15`}}>
                    <Target style={{color: PRIMARY}} size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">Goals Overview</h3>
                </div>
                <div className="space-y-6">
                  {[ 'weekly', 'monthly', 'yearly' ].map(type => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-700 flex items-center gap-2 text-base">
                          <span className="text-xl">{type === 'weekly' ? '📝' : type === 'monthly' ? '📅' : '🎯'}</span>
                          {type.charAt(0).toUpperCase() + type.slice(1)} Goals
                        </h4>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                          {goals[type].filter(g => g.completed).length}/{goals[type].length}
                        </span>
                      </div>
                      {goals[type].slice(0, 5).map(goal => (
                        <div key={goal.id} className={`flex items-center gap-2 mb-2 text-sm ${goal.completed ? 'text-gray-400' : 'text-gray-700'}`}>
                          <span className="text-base">{goal.completed ? '✅' : '⭕'}</span>
                          <span className={goal.completed ? 'line-through' : ''}>{goal.text}</span>
                        </div>
                      ))}
                      {goals[type].length === 0 && (
                        <div className="text-sm text-gray-500">No {type} goals yet.</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border-2 transition-all duration-300" style={{borderColor: `${PRIMARY}40`}}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl" style={{background: `${SECONDARY}20`}}>
                    <Flame style={{color: SECONDARY}} size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">Top Habits</h3>
                </div>
                <div className="space-y-3">
                  {habits.slice(0, 4).map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{
                      background: `linear-gradient(135deg, ${SECONDARY}15 0%, ${PRIMARY}10 100%)`,
                      borderColor: `${SECONDARY}60`
                    }}>
                      <span className="font-bold text-sm text-gray-800">{habit.name}</span>
                      <span className="px-3 py-1 rounded-xl font-black shadow-md text-sm" style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                        color: 'white'
                      }}>
                        {habit.streak} 🔥
                      </span>
                    </div>
                  ))}
                  {habits.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Flame size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Start tracking habits!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="glass-card p-4 md:p-8 rounded-3xl border-2 transition-all duration-300 animate-fadeIn" style={{borderColor: `${PRIMARY}40`}}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">📅</span> Weekly Tracker
              </h2>
              {/* FIX: Navigation buttons use flex-wrap to avoid overflowing on very small screens */}
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => {
                    const prevWeek = new Date(currentWeek);
                    prevWeek.setDate(prevWeek.getDate() - 7);
                    setCurrentWeek(prevWeek.toISOString().split('T')[0]);
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                    boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                  }}
                  className="px-3 py-2 text-white rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentWeek(getCurrentWeekKey())}
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                    boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                  }}
                  className="px-3 py-2 text-white rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    const nextWeek = new Date(currentWeek);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setCurrentWeek(nextWeek.toISOString().split('T')[0]);
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                    boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                  }}
                  className="px-3 py-2 text-white rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* FIX: Input and button stack vertically on mobile (full width for both) */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3"> 
                <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                    placeholder="Add new activity..."
                    className="flex-1 w-full px-4 py-3 border-2 rounded-2xl focus:outline-none font-medium text-gray-700 transition-all duration-300"
                    style={{borderColor: `${PRIMARY}60`}}
              />
              <button
                onClick={addActivity}
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                }}
                className="w-full sm:w-auto px-5 py-3 text-white rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {/* FIX: Table container ensures horizontal scroll and minimum width */}
            <div className="overflow-x-auto rounded-2xl shadow-lg">
              <table className="w-full border-collapse min-w-[600px] md:min-w-full">
                <thead>
                  <tr style={{
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                    boxShadow: `0 4px 15px rgba(146, 72, 122, 0.2)`
                  }} className="text-white">
                    {/* FIX: Sticky left column */}
                    <th className="border-2 p-3 text-left font-black text-sm md:text-lg sticky left-0 z-20" style={{borderColor: PRIMARY, backgroundColor: PRIMARY}}>Date / Day</th>
                    {weeklyActivities.map((activity, idx) => (
                      <th key={idx} className="border-2 p-3 text-center font-black text-sm md:text-lg min-w-[80px]" style={{borderColor: PRIMARY}}>
                        {editingActivity === activity ? (
                          <input
                            type="text"
                            defaultValue={activity}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') updateActivity(activity, e.target.value);
                            }}
                            onBlur={(e) => updateActivity(activity, e.target.value)}
                            className="w-full px-1 py-1 border-2 rounded-xl text-xs text-gray-700"
                            autoFocus
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-sm md:text-base">{activity}</span>
                            <div className='flex gap-1'>
                              <button onClick={() => setEditingActivity(activity)} className="text-blue-100 hover:text-white">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => removeActivity(activity)} className="text-blue-100 hover:text-white">
                                <X size={14} />
                              </button>
                            </div>
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
                      <tr key={idx} className={`${isToday ? 'bg-yellow-50/50' : 'bg-white/80'} transition-colors`}>
                        {/* FIX: Sticky left cell */}
                        <td className="border-2 p-3 font-bold text-gray-700 text-xs md:text-sm sticky left-0 z-10 glass-card" style={{borderColor: PRIMARY, minWidth: '100px'}}>
                          <div className="flex items-center gap-2">
                            {isToday && <span className="text-lg">👉</span>}
                            <div>
                              <div className="text-sm">{date.getDate()}-{date.toLocaleString('default', { month: 'short' })}</div>
                              <div className="text-xs text-gray-500 font-medium">{dayNames[date.getDay()]}</div>
                            </div>
                          </div>
                        </td>
                        {weeklyActivities.map((activity, actIdx) => (
                          <td key={actIdx} className="border-2 p-2 text-center" style={{borderColor: PRIMARY}}>
                            <div className="flex flex-col xs:flex-row items-center justify-center gap-1">
                              <button
                                onClick={() => setActivityState(date, activity, 'done')}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all`}
                                style={weeklyData[dateKey]?.[activity] === 'done' ? { background: PRIMARY, color: 'white', boxShadow: '0 2px 5px rgba(146, 72, 122, 0.2)' } : { background: '#ffffff', color: PRIMARY, border: `1px solid ${PRIMARY}` }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setActivityState(date, activity, 'skipped')}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all`}
                                style={weeklyData[dateKey]?.[activity] === 'skipped' ? { background: SECONDARY, color: 'white', boxShadow: '0 2px 5px rgba(228, 155, 166, 0.2)' } : { background: '#ffffff', color: SECONDARY, border: `1px solid ${SECONDARY}` }}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
                <div className="inline-block px-6 py-3 text-white rounded-2xl shadow-xl" style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 8px 25px rgba(146, 72, 122, 0.3)`
                }}>
                <span className="text-base font-medium">Weekly Completion: </span>
                <span className="font-black text-2xl ml-2">{weeklyCompletion}%</span>
                <span className="ml-2 text-xl">
                  {weeklyCompletion >= 80 ? '🔥' : weeklyCompletion >= 50 ? '💪' : '📈'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4 md:space-y-6 animate-fadeIn">
            {[
              { type: 'yearly', color: 'from-purple-500 to-violet-600', emoji: '🎯', title: 'Yearly Goals' },
              { type: 'monthly', color: 'from-blue-500 to-cyan-600', emoji: '📅', title: 'Monthly Goals' },
              { type: 'weekly', color: 'from-emerald-500 to-teal-600', emoji: '📝', title: 'Weekly Goals' }
            ].map(({ type, color, emoji, title }) => (
              <div key={type} className="glass-card p-6 rounded-3xl border-2 transition-all duration-300" style={{borderColor: `${PRIMARY}40`}}>
                <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                  <span className="text-3xl">{emoji}</span> {title}
                </h3>
                {/* FIX: Input and button stack vertically on mobile */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input
                    type="text"
                    value={newGoalInputs[type] ?? ''}
                    onChange={(e) => setNewGoalInputs(prev => ({ ...prev, [type]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addGoal(type)}
                    placeholder={`Add ${type} goal...`}
                    className="flex-1 w-full px-4 py-3 border-2 rounded-2xl focus:outline-none font-medium transition-all duration-300"
                    style={{borderColor: `${PRIMARY}60`}}
                  />
                  <button
                    onClick={() => addGoal(type)}
                    className={`w-full sm:w-auto px-6 py-3 text-white rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
                    style={{
                      background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                      boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {goals[type].map(goal => (
                    <div key={goal.id} className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]" style={ goal.completed ? { 
                      background: `linear-gradient(135deg, ${SECONDARY}15 0%, ${PRIMARY}10 100%)`, 
                      borderColor: `${SECONDARY}60` 
                    } : { 
                      background: '#ffffff', 
                      borderColor: `${PRIMARY}40` 
                    }}>
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => toggleGoal(type, goal.id)}
                        className="w-6 h-6 rounded-lg cursor-pointer"
                        style={{accentColor: PRIMARY}}
                      />
                      <span className={`flex-1 text-base font-medium ${goal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {goal.text}
                      </span>
                      {goal.completed && <span className="text-xl">✨</span>}
                      <button
                        onClick={() => deleteGoal(type, goal.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {goals[type].length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Target size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-base font-medium">No {type} goals yet. Start setting some!</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="glass-card p-6 rounded-3xl border-2 transition-all duration-300 animate-fadeIn" style={{borderColor: `${SECONDARY}40`}}>
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🔥</span> Habit Tracker
            </h2>
            {/* FIX: Input and button stack vertically on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Add new habit..."
                className="flex-1 w-full px-4 py-3 border-2 rounded-2xl focus:outline-none font-medium transition-all duration-300"
                style={{borderColor: `${SECONDARY}60`}}
              />
              <button
                onClick={addHabit}
                className="w-full sm:w-auto px-6 py-3 text-white rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                }}
              >
                <Plus size={20} />
              </button>
            </div>
                <div className="grid gap-4">
              {habits.map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const doneToday = habit.lastDone === today;
                return (
                  <div key={habit.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border-2 hover:shadow-xl hover:scale-[1.02] transition-all duration-300" style={{
                    background: `linear-gradient(135deg, ${SECONDARY}15 0%, ${PRIMARY}10 100%)`,
                    borderColor: `${SECONDARY}60`
                  }}>
                    <div>
                      <h4 className="font-black text-lg text-gray-800">{habit.name}</h4>
                      <p className="text-xs text-gray-600 font-medium mt-1">
                        {habit.streak > 0 ? `${habit.streak} day streak 🔥` : 'Start your streak today!'}
                      </p>
                    </div>
                      <div className="flex items-center gap-3 mt-3 sm:mt-0">
                      <button
                        onClick={() => trackHabit(habit.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-md`}
                        style={ doneToday ? { 
                          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                          color: 'white',
                          boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                        } : { 
                          background: `linear-gradient(135deg, ${SECONDARY} 0%, ${PRIMARY} 100%)`,
                          color: 'white',
                          boxShadow: `0 4px 15px rgba(228, 155, 166, 0.3)`
                        }}
                      >
                        {doneToday ? '✓ Done Today' : 'Mark Done'}
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {habits.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Flame size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No habits yet. Add one above to start your journey!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="glass-card p-6 rounded-3xl border-2 transition-all duration-300 animate-fadeIn" style={{borderColor: `${PRIMARY}40`}}>
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">✅</span> Daily Tasks
            </h2>
            {/* FIX: Input and button stack vertically on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newTaskInputs.daily ?? ''}
                onChange={(e) => setNewTaskInputs(prev => ({ ...prev, daily: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addTask('daily')}
                placeholder="Add new task..."
                className="flex-1 w-full px-4 py-3 border-2 rounded-2xl focus:outline-none font-medium transition-all duration-300"
                style={{borderColor: `${PRIMARY}60`}}
              />
              <button
                onClick={() => addTask('daily')}
                className="w-full sm:w-auto px-6 py-3 text-white rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                }}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {dailyTasks
                .slice()
                .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
                .map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}
                    style={ task.priority ? { 
                      background: `linear-gradient(135deg, ${PRIMARY}15 0%, ${SECONDARY}10 100%)`, 
                      borderColor: `${PRIMARY}60` 
                    } : { 
                      background: '#ffffff', 
                      borderColor: `${SECONDARY}40` 
                    }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask('daily', task.id)}
                      className="w-6 h-6 text-pink-600 rounded-lg cursor-pointer"
                      style={{accentColor: PRIMARY}}
                    />
                    <span className={`flex-1 text-base font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.text}
                    </span>
                    {task.completed && <span className="text-xl">🎉</span>}
                    <button
                      onClick={() => togglePriority('daily', task.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-300 shadow-md whitespace-nowrap`}
                      style={ task.priority ? { 
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                        color: 'white',
                        boxShadow: `0 2px 10px rgba(146, 72, 122, 0.3)`
                      } : { 
                        background: `${SECONDARY}25`, 
                        color: '#333' 
                      }}
                    >
                      {task.priority ? '⭐ Priority' : 'Normal'}
                    </button>
                    <button
                      onClick={() => deleteTask('daily', task.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              {dailyTasks.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No tasks yet. Add one above to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="glass-card p-6 rounded-3xl border-2 transition-all duration-300 animate-fadeIn" style={{borderColor: `${PRIMARY}40`}}>
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">⏳</span> Pending Tasks
            </h2>
            {/* FIX: Input and button stack vertically on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newTaskInputs.pending ?? ''}
                onChange={(e) => setNewTaskInputs(prev => ({ ...prev, pending: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addTask('pending')}
                placeholder="Add new pending task..."
                className="flex-1 w-full px-4 py-3 border-2 rounded-2xl focus:outline-none font-medium transition-all duration-300"
                style={{borderColor: `${PRIMARY}60`}}
              />
              <button
                onClick={() => addTask('pending')}
                className="w-full sm:w-auto px-6 py-3 text-white rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                }}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {pendingTasks
                .slice()
                .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
                  .map(task => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:shadow-lg`}
                      style={ task.priority ? { background: `${PRIMARY}11`, borderColor: PRIMARY } : { background: '#ffffff', borderColor: SECONDARY }}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask('pending', task.id)}
                        className="w-6 h-6 text-pink-600 rounded-lg cursor-pointer"
                      />
                      <span className={`flex-1 text-base font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.text}
                      </span>
                      {task.completed && <span className="text-xl">🎉</span>}
                      <button
                        onClick={() => togglePriority('pending', task.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-300 shadow-md whitespace-nowrap`}
                        style={ task.priority ? { 
                          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                          color: 'white',
                          boxShadow: `0 2px 10px rgba(146, 72, 122, 0.3)`
                        } : { 
                          background: `${SECONDARY}25`, 
                          color: '#333' 
                        }}
                      >
                        {task.priority ? '⭐ Priority' : 'Normal'}
                      </button>
                      <button
                        onClick={() => deleteTask('pending', task.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No pending tasks. Great job!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="glass-card p-6 rounded-3xl border-2 transition-all duration-300 animate-fadeIn" style={{borderColor: `${PRIMARY}40`}}>
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">📖</span> Journal & Notes
            </h2>
            <div className="mb-8">
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Write your thoughts, reflections, or things to remember..."
                className="w-full px-4 py-3 border-2 rounded-2xl focus:outline-none min-h-[150px] font-medium text-gray-700 transition-all duration-300"
                style={{borderColor: `${PRIMARY}60`}}
              />
              <button
                onClick={addJournalEntry}
                className="mt-4 px-6 py-3 text-white rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
                  boxShadow: `0 4px 15px rgba(146, 72, 122, 0.3)`
                }}
              >
                <Save size={20} /> Save Entry
              </button>
            </div>
            <div className="space-y-4">
              {journal.map(entry => {
                const date = new Date(entry.date);
                return (
                  <div key={entry.id} className="p-4 rounded-2xl border-2 hover:shadow-xl hover:scale-[1.01] transition-all duration-300" style={{
                    background: `linear-gradient(135deg, ${SECONDARY}15 0%, ${PRIMARY}10 100%)`,
                    borderColor: `${SECONDARY}60`
                  }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-xs font-bold text-gray-600">
                        {date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">{entry.text}</p>
                  </div>
                );
              })}
              {journal.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No journal entries yet. Start writing above!</p>
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