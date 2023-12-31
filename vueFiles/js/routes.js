import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Settings from './pages/Settings.js';
import ListPacks from './pages/ListPacks.js'
import Submissions from './pages/Submissions.js';
import UserSubmissions from './pages/UserSubmissions.js';
import Submit from './pages/Submit.js';
import ListEditor from './pages/ListEditor.js';
import AdminEditor from './pages/AdminEditor.js';
import AdminPanel from './pages/AdminPanel.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/settings', component: Settings },
    { path: '/submit', component: Submit },
    { path: "/adminpanel", component: AdminPanel},
    { path: '/submissions', component: Submissions },
    { path: "/editlist", component: ListEditor},
    { path: "/editadmins", component: AdminEditor},
    { path: '/submissions/@me', component: UserSubmissions },
    { path: '/list-packs', component: ListPacks },
];