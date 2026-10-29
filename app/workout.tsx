import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Surface } from '@/components/Surface';
import { theme } from '@/constants/theme';
import { addSet, createExercise, createSession, Exercise, finishSession, getLatestExerciseSets, getPlanExercises, getSessionSets, listExercises, setSessionDeload, updateSet } from '@/db/workouts';
import { recommendProgression } from '@/db/progression';

type Row = { id:string; exerciseId:string; exerciseName:string; setNumber:number; weight:string; reps:string; completed:boolean; previous?:{weight:number;reps:number} };
export default function WorkoutScreen() {
  const params = useLocalSearchParams<{planId?:string;planName?:string;sessionId?:string}>();
  const router = useRouter();
  const [sessionId,setSessionId] = useState(params.sessionId ?? '');
  const [title,setTitle] = useState(params.planName ?? 'Quick Workout');
  const [rows,setRows] = useState<Row[]>([]);
  const [exercises,setExercises] = useState<Exercise[]>([]);
  const [adding,setAdding] = useState(false);
  const [customName,setCustomName] = useState('');
  const [saving,setSaving] = useState(false);
  const [isDeload,setIsDeload] = useState(false);
  const [ready,setReady] = useState(false);
  const completedCount = rows.filter(r => r.completed).length;
  const totalVolume = rows.reduce((sum,r) => sum + (Number(r.weight)||0)*(Number(r.reps)||0),0);
  const grouped = useMemo(() => { const map = new Map<string,Row[]>(); rows.forEach(r => map.set(r.exerciseId,[...(map.get(r.exerciseId)??[]),r])); return [...map.entries()]; },[rows]);

  useEffect(() => { (async () => {
    try {
      const lib = await listExercises(); setExercises(lib);
      let sid = params.sessionId ?? '';
      if (!sid) sid = await createSession(params.planName ?? 'Quick Workout', params.planId ?? null, false);
      setSessionId(sid);
      if (params.planId) {
        const planExercises = await getPlanExercises(params.planId);
        const initial: Row[] = [];
        for (const ex of planExercises) {
          const prev = await getLatestExerciseSets(ex.id,sid);
          for(let i=1;i<=ex.target_sets;i++) initial.push({id:'',exerciseId:ex.id,exerciseName:ex.name,setNumber:i,weight:prev[i-1]?.weight?.toString() ?? prev[0]?.weight?.toString() ?? '0',reps:'',completed:false,previous:prev[i-1] ?? prev[0]});
        }
        // Persist plan-derived rows once; session may already contain autosaved sets when resuming.
        const saved = await getSessionSets(sid);
        if(saved.length) {
          const rebuilt: Row[] = [];
          for(const s of saved) { const ex=lib.find(e=>e.id===s.exercise_id); if(ex) { const prev=await getLatestExerciseSets(ex.id,sid); rebuilt.push({id:s.id,exerciseId:ex.id,exerciseName:ex.name,setNumber:s.set_number,weight:String(s.weight),reps:String(s.reps),completed:!!s.completed_at,previous:prev[s.set_number-1] ?? prev[0]}); } }
          setRows(rebuilt);
        } else {
          for(const r of initial) { const id=await addSet(sid,r.exerciseId,r.setNumber,Number(r.weight)||0,0); r.id=id; }
          setRows(initial);
        }
      } else {
        const saved=await getSessionSets(sid); const rebuilt:Row[]=[];
        for(const s of saved) { const ex=lib.find(e=>e.id===s.exercise_id); if(ex) { const prev=await getLatestExerciseSets(ex.id,sid); rebuilt.push({id:s.id,exerciseId:ex.id,exerciseName:ex.name,setNumber:s.set_number,weight:String(s.weight),reps:String(s.reps),completed:!!s.completed_at,previous:prev[s.set_number-1]??prev[0]}); } }
        setRows(rebuilt);
      }
    } catch(e) { Alert.alert('Workout could not start',e instanceof Error?e.message:String(e)); }
    finally { setReady(true); }
  })(); },[]);

  const patchRow = async (row:Row, changes:Partial<Row>) => {
    const next={...row,...changes}; setRows(old=>old.map(r=>r.id===row.id?next:r));
    if(next.id) { setSaving(true); try { await updateSet(next.id,Number(next.weight)||0,Number(next.reps)||0,next.completed); } catch(e) { Alert.alert('Autosave failed',String(e)); } finally { setSaving(false); } }
  };
  const addExercise = async (exercise:Exercise) => {
    if(rows.some(r=>r.exerciseId===exercise.id)) { Alert.alert('Already added','This exercise is already in the workout.'); return; }
    const id=await addSet(sessionId,exercise.id,1,0,0);
    const prev=await getLatestExerciseSets(exercise.id,sessionId);
    setRows(old=>[...old,{id,exerciseId:exercise.id,exerciseName:exercise.name,setNumber:1,weight:prev[0]?.weight?.toString()??'0',reps:'',completed:false,previous:prev[0]}]);
    if(prev[0]) await updateSet(id,prev[0].weight,0,false);
    setAdding(false);
  };
  const addAnotherSet = async (exerciseId:string, exerciseName:string) => {
    const existing=rows.filter(r=>r.exerciseId===exerciseId); const number=existing.length+1; const last=existing[existing.length-1];
    const id=await addSet(sessionId,exerciseId,number,Number(last?.weight)||0,0);
    setRows(old=>[...old,{id,exerciseId,exerciseName,setNumber:number,weight:last?.weight??'0',reps:'',completed:false,previous:last?.previous}]);
  };
  const addCustom = async () => { try { const id=await createExercise(customName); const ex=(await listExercises()).find(e=>e.id===id)!; setExercises(old=>old.some(e=>e.id===id)?old:[...old,ex]); setCustomName(''); await addExercise(ex); } catch(e) { Alert.alert('Exercise not added',e instanceof Error?e.message:String(e)); } };
  const finish = async () => { if(!sessionId) return; Alert.alert('Finish workout?',`You completed ${completedCount} of ${rows.length} sets.`,[{text:'Keep training',style:'cancel'},{text:'Finish',onPress:async()=>{try{await finishSession(sessionId);router.replace('/(tabs)');}catch(e){Alert.alert('Could not finish workout',String(e));}}}]); };

  return <Screen>
    <Stack.Screen options={{headerShown:true,title:'Workout',headerTintColor:theme.colors.text,headerStyle:{backgroundColor:theme.colors.background},headerBackTitle:'Back'}} />
    <View style={styles.top}><View style={{flex:1}}><Text style={styles.kicker}>WORKOUT IN PROGRESS</Text><Text style={styles.title}>{title}</Text><Text style={styles.muted}>{saving?'Saving…':'Autosaved on this device'}</Text></View><Pressable onPress={()=>{const next=!isDeload;setIsDeload(next);if(sessionId)setSessionDeload(sessionId,next).catch(e=>Alert.alert('Could not save deload setting',String(e)));}} style={[styles.deload,isDeload&&styles.deloadOn]}><Text style={[styles.deloadText,isDeload&&{color:theme.colors.accentText}]}>{isDeload?'DELOAD ON':'DELOAD'}</Text></Pressable></View>
    <View style={styles.metrics}><Surface style={styles.metric}><Text style={styles.metricValue}>{completedCount}/{rows.length}</Text><Text style={styles.muted}>SETS DONE</Text></Surface><Surface style={styles.metric}><Text style={styles.metricValue}>{Math.round(totalVolume).toLocaleString()}</Text><Text style={styles.muted}>VOLUME · { 'KG' }</Text></Surface></View>
    {!ready ? <Text style={styles.muted}>Loading workout…</Text> : grouped.map(([exerciseId,exerciseRows])=><Surface key={exerciseId} style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}><View style={{flex:1}}><Text style={styles.exerciseTitle}>{exerciseRows[0].exerciseName}</Text>{exerciseRows[0].previous&&<Text style={styles.previous}>Previous: {exerciseRows[0].previous.weight} kg × {exerciseRows[0].previous.reps} reps</Text>}</View><Text style={styles.muted}>{exerciseRows.length} sets</Text></View>
      {(()=>{const recommendation=recommendProgression(exerciseRows.filter(r=>r.previous).map(r=>({weight:r.previous!.weight,reps:r.previous!.reps})),{deload:isDeload});return <View style={styles.recommendation}><Text style={styles.recommendationTitle}>{recommendation.message}</Text><Text style={styles.recommendationReason}>{recommendation.reason}</Text></View>;})()}
      <View style={styles.tableHead}><Text style={[styles.tableLabel,{width:34}]}>SET</Text><Text style={[styles.tableLabel,{flex:1}]}>KG</Text><Text style={[styles.tableLabel,{flex:1}]}>REPS</Text><Text style={[styles.tableLabel,{width:52,textAlign:'right'}]}>DONE</Text></View>
      {exerciseRows.map(row=><View key={row.id} style={styles.setRow}><Text style={[styles.setNumber,{width:34}]}>{row.setNumber}</Text><TextInput keyboardType="decimal-pad" value={row.weight} onChangeText={v=>patchRow(row,{weight:v})} style={[styles.cell,{flex:1}]} selectTextOnFocus/><TextInput keyboardType="number-pad" value={row.reps} onChangeText={v=>patchRow(row,{reps:v})} style={[styles.cell,{flex:1}]} selectTextOnFocus/><Pressable onPress={()=>patchRow(row,{completed:!row.completed})} style={[styles.done,{width:40},row.completed&&styles.doneOn]}><Text style={{color:row.completed?theme.colors.accentText:theme.colors.muted,fontWeight:'900'}}>{row.completed?'✓':'○'}</Text></Pressable></View>)}
      <Pressable onPress={()=>addAnotherSet(exerciseId,exerciseRows[0].exerciseName)} style={styles.addSet}><Text style={styles.addSetText}>+ Add set</Text></Pressable>
    </Surface>)}
    <Pressable style={styles.secondaryButton} onPress={()=>setAdding(v=>!v)}><Text style={styles.secondaryText}>{adding?'Close exercise picker':'+ Add exercise'}</Text></Pressable>
    {adding&&<Surface style={{gap:10}}><Text style={styles.exerciseTitle}>Exercise library</Text><ScrollView style={{maxHeight:230}}>{exercises.map(ex=><Pressable key={ex.id} style={styles.pick} onPress={()=>addExercise(ex)}><View style={{flex:1}}><Text style={styles.exerciseName}>{ex.name}</Text><Text style={styles.muted}>{ex.muscle_group} · {ex.equipment}</Text></View><Text style={styles.addSetText}>Add +</Text></Pressable>)}</ScrollView><TextInput value={customName} onChangeText={setCustomName} placeholder="Custom exercise name" placeholderTextColor={theme.colors.muted} style={styles.customInput}/><Pressable style={styles.secondaryButton} onPress={addCustom}><Text style={styles.secondaryText}>Create and add exercise</Text></Pressable></Surface>}
    <Pressable style={styles.finish} onPress={finish}><Text style={styles.finishText}>Finish workout</Text></Pressable>
    <Text style={styles.footer}>Your sets are saved locally as you edit them. Leave and reopen the app to continue an in-progress session from Today.</Text>
  </Screen>;
}
const styles=StyleSheet.create({top:{flexDirection:'row',alignItems:'center',gap:10},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:theme.colors.accent},title:{fontSize:25,fontWeight:'900',color:theme.colors.text,marginTop:5},muted:{fontSize:12,color:theme.colors.muted,marginTop:4},deload:{borderWidth:1,borderColor:theme.colors.border,borderRadius:10,padding:10},deloadOn:{backgroundColor:theme.colors.accent,borderColor:theme.colors.accent},deloadText:{fontSize:10,fontWeight:'900',color:theme.colors.muted},metrics:{flexDirection:'row',gap:10},metric:{flex:1,gap:5},metricValue:{fontSize:23,fontWeight:'900',color:theme.colors.text},exerciseCard:{gap:10},exerciseHeader:{flexDirection:'row',alignItems:'center'},exerciseTitle:{fontSize:17,fontWeight:'900',color:theme.colors.text},previous:{fontSize:11,color:theme.colors.accent,marginTop:4},tableHead:{flexDirection:'row',alignItems:'center',gap:8},tableLabel:{fontSize:9,color:theme.colors.muted,fontWeight:'900',letterSpacing:1},setRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:7},setNumber:{color:theme.colors.muted,fontWeight:'800'},cell:{backgroundColor:theme.colors.background,borderColor:theme.colors.border,borderWidth:1,borderRadius:9,color:theme.colors.text,paddingHorizontal:10,paddingVertical:9,textAlign:'center'},done:{height:38,alignItems:'center',justifyContent:'center',borderRadius:9,borderWidth:1,borderColor:theme.colors.border},doneOn:{backgroundColor:theme.colors.accent,borderColor:theme.colors.accent},addSet:{alignSelf:'flex-start',paddingVertical:6,paddingHorizontal:4},addSetText:{color:theme.colors.accent,fontWeight:'900',fontSize:12},secondaryButton:{borderWidth:1,borderColor:theme.colors.border,borderRadius:12,padding:14,alignItems:'center'},secondaryText:{color:theme.colors.text,fontWeight:'800'},pick:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:theme.colors.border},exerciseName:{color:theme.colors.text,fontWeight:'700'},customInput:{backgroundColor:theme.colors.background,color:theme.colors.text,borderWidth:1,borderColor:theme.colors.border,borderRadius:10,padding:12},finish:{backgroundColor:theme.colors.accent,borderRadius:13,padding:16,alignItems:'center'},finishText:{color:theme.colors.accentText,fontWeight:'900',fontSize:15},recommendation:{backgroundColor:theme.colors.background,borderWidth:1,borderColor:theme.colors.border,borderRadius:10,padding:10,gap:4},recommendationTitle:{color:theme.colors.accent,fontSize:12,fontWeight:'900'},recommendationReason:{color:theme.colors.muted,fontSize:11,lineHeight:15},footer:{fontSize:11,lineHeight:16,color:theme.colors.muted,textAlign:'center',paddingHorizontal:12}});
