import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Settings from './pages/Settings.js';
import ListPacks from './pages/ListPacks.js'
import Submissions from './pages/Submissions.js';
import UserSubmissions from './pages/UserSubmissions.js';
import Submit from './pages/Submit.js';
import ListEditor from './pages/ListEditor.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/settings', component: Settings },
    { path: '/submit', component: Submit },
    { path: '/submissions', component: Submissions },
    { path: "/editlist", component: ListEditor},
    { path: '/submissions/@me', component: UserSubmissions },
    { path: '/list-packs', component: ListPacks },
];