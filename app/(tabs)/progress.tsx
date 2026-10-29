import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Surface } from '@/components/Surface';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/db/database';

type Summary = { workouts: number; total_sets: number; total_volume: number; active_days: number };
type Trend = { week: string; workouts: number; volume: number };
type Exercise = { id: string; name: string };
type ExerciseHistory = { session_id: string; date: string; name: string; max_weight: number; reps: number; volume: number };
type PR = { exercise_id: string; name: string; max_weight: number; max_reps: number; best_volume: number };
const startOfWeek = (date: Date) => { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d; };

export default function ProgressScreen() {
  const [summary,setSummary] = useState<Summary>({workouts:0,total_sets:0,total_volume:0,active_days:0});
  const [trends,setTrends] = useState<Trend[]>([]);
  const [exercises,setExercises] = useState<Exercise[]>([]);
  const [selectedExercise,setSelectedExercise] = useState<string>('');
  const [history,setHistory] = useState<ExerciseHistory[]>([]);
  const [prs,setPrs] = useState<PR[]>([]);
  const [loading,setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const s = await db.getFirstAsync<Summary>(`SELECT COUNT(*) AS workouts,
        (SELECT COUNT(*) FROM workout_sets ws JOIN workout_sessions ss ON ss.id=ws.session_id WHERE ss.status='completed' AND ws.completed_at IS NOT NULL) AS total_sets,
        (SELECT COALESCE(SUM(ws.weight*ws.reps),0) FROM workout_sets ws JOIN workout_sessions ss ON ss.id=ws.session_id WHERE ss.status='completed' AND ws.completed_at IS NOT NULL AND ws.set_type='working') AS total_volume,
        (SELECT COUNT(DISTINCT date(COALESCE(completed_at,started_at),'localtime')) FROM workout_sessions WHERE status='completed') AS active_days
        FROM workout_sessions WHERE status='completed'`);
      setSummary(s || {workouts:0,total_sets:0,total_volume:0,active_days:0});
      const raw = await db.getAllAsync<{date:string; workouts:number; volume:number}>(`SELECT date(COALESCE(completed_at,started_at),'localtime') AS date, COUNT(*) AS workouts,
        COALESCE(SUM((SELECT SUM(ws.weight*ws.reps) FROM workout_sets ws WHERE ws.session_id=s.id AND ws.completed_at IS NOT NULL AND ws.set_type='working')),0) AS volume
        FROM workout_sessions s WHERE status='completed' AND COALESCE(completed_at,started_at) >= ? GROUP BY date ORDER BY date`, new Date(Date.now()-56*86400000).toISOString());
      const byWeek: Record<string,Trend> = {};
      raw.forEach(r=>{ const d = startOfWeek(new Date(`${r.date}T12:00:00`)); const key = d.toISOString().slice(0,10); if(!byWeek[key]) byWeek[key]={week:key,workouts:0,volume:0}; byWeek[key].workouts += r.workouts; byWeek[key].volume += r.volume; });
      setTrends(Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week)).slice(-8));
      const ex = await db.getAllAsync<Exercise>('SELECT DISTINCT e.id,e.name FROM exercises e JOIN workout_sets ws ON ws.exercise_id=e.id JOIN workout_sessions s ON s.id=ws.session_id WHERE s.status=\'completed\' AND ws.completed_at IS NOT NULL ORDER BY e.name COLLATE NOCASE');
      setExercises(ex);
      setSelectedExercise(current => ex.some(e=>e.id===current) ? current : ex[0]?.id || '');
      const prRows = await db.getAllAsync<PR>(`SELECT e.id AS exercise_id,e.name,MAX(ws.weight) AS max_weight,MAX(ws.reps) AS max_reps,
        MAX(ws.weight*ws.reps) AS best_volume FROM exercises e JOIN workout_sets ws ON ws.exercise_id=e.id JOIN workout_sessions s ON s.id=ws.session_id
        WHERE s.status='completed' AND ws.completed_at IS NOT NULL AND ws.set_type='working' GROUP BY e.id,e.name ORDER BY max_weight DESC LIMIT 8`);
      setPrs(prRows);
    } catch(e) { console.warn('Could not load progress dashboard',e); }
    finally { setLoading(false); }
  },[]);
  useFocusEffect(useCallback(()=>{load();},[load]));

  useFocusEffect(useCallback(()=>{ let active=true; (async()=>{ if(!selectedExercise)return; try { const db=await getDatabase(); const rows=await db.getAllAsync<ExerciseHistory>(`SELECT s.id AS session_id, date(COALESCE(s.completed_at,s.started_at),'localtime') AS date,s.name,
    MAX(ws.weight) AS max_weight,MAX(ws.reps) AS reps,SUM(ws.weight*ws.reps) AS volume FROM workout_sessions s JOIN workout_sets ws ON ws.session_id=s.id
    WHERE s.status='completed' AND ws.completed_at IS NOT NULL AND ws.set_type='working' AND ws.exercise_id=? GROUP BY s.id ORDER BY COALESCE(s.completed_at,s.started_at) DESC LIMIT 12`,selectedExercise); if(active)setHistory(rows); } catch(e){console.warn(e);} })(); return ()=>{active=false}; },[selectedExercise]));

  const maxVolume = useMemo(()=>Math.max(1,...trends.map(t=>t.volume)),[trends]);
  const maxWorkouts = useMemo(()=>Math.max(1,...trends.map(t=>t.workouts)),[trends]);
  const selectedName = exercises.find(e=>e.id===selectedExercise)?.name || 'Select an exercise';
  return <Screen>
    <SectionTitle eyebrow="Small wins add up" title="Progress" />
    <View style={styles.metrics}>
      <Metric label="WORKOUTS" value={summary.workouts}/><Metric label="ACTIVE DAYS" value={summary.active_days}/>
      <Metric label="COMPLETED SETS" value={summary.total_sets}/><Metric label="WORKING VOLUME" value={Math.round(summary.total_volume).toLocaleString()} suffix="kg·reps"/>
    </View>
    <Surface>
      <Text style={styles.heading}>Last 8 weeks</Text><Text style={styles.caption}>Weekly training volume · weight × reps on completed working sets</Text>
      {loading ? <Text style={styles.caption}>Loading progress…</Text> : trends.length===0 ? <Text style={styles.body}>Complete a workout and log its sets to start building your progress history.</Text> : <View style={styles.chart}>
        {trends.map(t=><View key={t.week} style={styles.barColumn}><Text style={styles.barValue}>{Math.round(t.volume/1000*10)/10}k</Text><View style={styles.barTrack}><View style={[styles.bar,{height:`${Math.max(4,t.volume/maxVolume*100)}%`}]} /></View><Text style={styles.barLabel}>{new Date(`${t.week}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</Text><Text style={styles.barSub}>{t.workouts}x</Text></View>)}
      </View>}
    </Surface>
    <Surface>
      <Text style={styles.heading}>Weekly consistency</Text><Text style={styles.caption}>Completed sessions per week</Text>
      {trends.length===0 ? <Text style={styles.body}>Your weekly summary will appear after your first completed workout.</Text> : trends.map(t=><View key={t.week} style={styles.weekRow}><Text style={styles.weekLabel}>{new Date(`${t.week}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</Text><View style={styles.weekTrack}><View style={[styles.weekBar,{width:`${Math.max(3,t.workouts/maxWorkouts*100)}%`}]} /></View><Text style={styles.weekCount}>{t.workouts}</Text></View>)}
    </Surface>
    <Surface>
      <Text style={styles.heading}>Exercise history</Text>
      {exercises.length===0 ? <Text style={styles.body}>No exercise history yet. Once you complete a workout, your logged working sets will appear here.</Text> : <>
        <View style={styles.exercisePicker}>{exercises.map(e=><Pressable key={e.id} onPress={()=>setSelectedExercise(e.id)} style={[styles.pill,selectedExercise===e.id&&styles.pillSelected]}><Text style={[styles.pillText,selectedExercise===e.id&&styles.pillTextSelected]}>{e.name}</Text></Pressable>)}</View>
        <Text style={styles.selectedName}>{selectedName}</Text>
        {history.length===0 ? <Text style={styles.body}>No completed sets found for this exercise.</Text> : history.map(h=><View key={h.session_id} style={styles.historyRow}><View style={{flex:1}}><Text style={styles.historyDate}>{new Date(`${h.date}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</Text><Text style={styles.caption}>{h.name}</Text></View><View style={styles.historyStats}><Text style={styles.historyWeight}>{h.max_weight} kg</Text><Text style={styles.caption}>{Math.round(h.volume).toLocaleString()} volume</Text></View></View>)}
      </>}
    </Surface>
    <Surface>
      <Text style={styles.heading}>Personal records</Text><Text style={styles.caption}>Best logged working-set values by exercise. These are records from your entries, not estimated 1RM.</Text>
      {prs.length===0 ? <Text style={styles.body}>Personal records will appear after you complete and log working sets.</Text> : prs.map(pr=><View key={pr.exercise_id} style={styles.prRow}><View style={{flex:1}}><Text style={styles.prName}>{pr.name}</Text><Text style={styles.caption}>Best single-set volume: {Math.round(pr.best_volume).toLocaleString()} kg·reps</Text></View><Text style={styles.prValue}>{pr.max_weight} kg</Text></View>)}
    </Surface>
  </Screen>;
}
function Metric({label,value,suffix}:{label:string;value:number|string;suffix?:string}){return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text>{suffix?<Text style={styles.metricSuffix}>{suffix}</Text>:null}</View>}
const styles=StyleSheet.create({metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'48%',flexGrow:1,backgroundColor:theme.colors.surface,borderColor:theme.colors.border,borderWidth:1,borderRadius:theme.radius.lg,padding:14,gap:5},metricLabel:{fontSize:10,color:theme.colors.muted,fontWeight:'900',letterSpacing:1},metricValue:{fontSize:25,color:theme.colors.text,fontWeight:'900'},metricSuffix:{fontSize:10,color:theme.colors.muted},heading:{color:theme.colors.text,fontSize:18,fontWeight:'900'},caption:{color:theme.colors.muted,fontSize:12,lineHeight:18},body:{color:theme.colors.muted,fontSize:14,lineHeight:21},chart:{height:180,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:5,marginTop:16},barColumn:{flex:1,alignItems:'center',height:'100%',justifyContent:'flex-end',gap:5},barValue:{fontSize:9,color:theme.colors.muted},barTrack:{height:112,width:'70%',justifyContent:'flex-end',backgroundColor:theme.colors.surfaceRaised,borderRadius:6,overflow:'hidden'},bar:{width:'100%',backgroundColor:theme.colors.accent,borderRadius:6},barLabel:{fontSize:9,color:theme.colors.muted},barSub:{fontSize:10,color:theme.colors.text,fontWeight:'800'},weekRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:12},weekLabel:{width:48,color:theme.colors.muted,fontSize:11},weekTrack:{flex:1,height:8,backgroundColor:theme.colors.surfaceRaised,borderRadius:6,overflow:'hidden'},weekBar:{height:'100%',backgroundColor:theme.colors.accent,borderRadius:6},weekCount:{width:18,color:theme.colors.text,textAlign:'right',fontWeight:'800',fontSize:12},exercisePicker:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8},pill:{paddingVertical:8,paddingHorizontal:11,borderRadius:20,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surfaceRaised},pillSelected:{backgroundColor:theme.colors.accent,borderColor:theme.colors.accent},pillText:{fontSize:12,color:theme.colors.text,fontWeight:'700'},pillTextSelected:{color:theme.colors.accentText},selectedName:{color:theme.colors.text,fontSize:15,fontWeight:'800',marginTop:16},historyRow:{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:theme.colors.border},historyDate:{color:theme.colors.text,fontWeight:'800',fontSize:13},historyStats:{alignItems:'flex-end',gap:3},historyWeight:{color:theme.colors.accent,fontSize:16,fontWeight:'900'},prRow:{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:theme.colors.border,gap:10},prName:{color:theme.colors.text,fontWeight:'800',fontSize:13},prValue:{color:theme.colors.accent,fontWeight:'900',fontSize:16}});
