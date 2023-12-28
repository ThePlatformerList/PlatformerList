import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Settings from './pages/Settings.js';
import ListPacks from './pages/ListPacks.js'

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/settings', component: Settings },
    { path: '/list-packs', component: ListPacks },
];