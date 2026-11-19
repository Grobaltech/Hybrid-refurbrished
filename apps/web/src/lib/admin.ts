import {supabase} from './supabase'
export async function adminUsers<T=unknown>(action:string,payload:Record<string,unknown>={}):Promise<T>{const {data,error}=await supabase.functions.invoke('admin-users',{body:{action,...payload}});if(error)throw new Error(error.message);if(data?.error)throw new Error(data.error);return data as T}
