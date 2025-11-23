import React from 'react';
import './main.css';
import { createRoot } from 'react-dom/client';
import ProgressPlannerApp from './ProgressPlannerApp.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ProgressPlannerApp />);
