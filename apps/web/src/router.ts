import {createRouter,createWebHistory} from 'vue-router';import {supabase} from './lib/supabase'
const router=createRouter({history:createWebHistory(),routes:[{path:'/login',component:()=>import('./views/LoginView.vue')},{path:'/',component:()=>import('./layouts/AppLayout.vue'),children:[{path:'',redirect:'/dashboard'},{path:'dashboard',component:()=>import('./views/DashboardView.vue')},{path:'users',component:()=>import('./views/UsersView.vue')},{path:'account',component:()=>import('./views/AccountView.vue')} ]},{path:'/:pathMatch(.*)*',redirect:'/dashboard'}]})
router.beforeEach(async to=>{const {data}=await supabase.auth.getSession();if(to.path==='/login')return data.session?'/dashboard':true;if(!data.session)return '/login';return true})
export default router
