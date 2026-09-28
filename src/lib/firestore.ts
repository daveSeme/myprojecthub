import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Profile, Project, Task, Ticket, Update } from './types';

export function requireDb(){ if(!db) throw new Error('Firebase is not configured. Create .env.local from .env.example.'); return db; }
export async function getProfile(uid:string){ const snap=await getDoc(doc(requireDb(),'users',uid)); return snap.exists()? snap.data() as Profile : null; }
export async function saveProfile(p:Profile){ await setDoc(doc(requireDb(),'users',p.uid),p,{merge:true}); }
export async function listCollection<T>(name:string){ const snap=await getDocs(collection(requireDb(),name)); return snap.docs.map(d=>({id:d.id,...d.data()})) as T[]; }
export async function listProjects(){ return listCollection<Project>('projects'); }
export async function listTasks(){ return listCollection<Task>('tasks'); }
export async function listUpdates(){ return listCollection<Update>('updates'); }
export async function listTickets(){ return listCollection<Ticket>('tickets'); }
export async function listUsers(){ return listCollection<Profile>('users'); }
export async function createProject(data:Omit<Project,'id'|'createdAt'>){ const ref=await addDoc(collection(requireDb(),'projects'),{...data,createdAt:serverTimestamp()}); return ref.id; }
export async function createTask(data:Omit<Task,'id'|'createdAt'>){ const ref=await addDoc(collection(requireDb(),'tasks'),{...data,createdAt:serverTimestamp()}); return ref.id; }
export async function createUpdate(data:Omit<Update,'id'|'createdAt'>){ const ref=await addDoc(collection(requireDb(),'updates'),{...data,createdAt:serverTimestamp()}); return ref.id; }
export async function createTicket(data:Omit<Ticket,'id'|'createdAt'>){ const ref=await addDoc(collection(requireDb(),'tickets'),{...data,createdAt:serverTimestamp()}); return ref.id; }
export async function updateTicket(id:string,data:Partial<Ticket>){ await updateDoc(doc(requireDb(),'tickets',id),data); }
export async function deleteProject(id:string){ await deleteDoc(doc(requireDb(),'projects',id)); }
