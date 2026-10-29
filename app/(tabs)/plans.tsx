import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Surface } from '@/components/Surface';
import { theme } from '@/constants/theme';
import { Exercise, WorkoutPlan, listExercises, listPlans, savePlan } from '@/db/workouts';

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const refresh = useCallback(async () => { setPlans(await listPlans()); setExercises(await listExercises()); }, []);
  useFocusEffect(useCallback(() => { refresh().catch(e => Alert.alert('Could not load plans', String(e))); }, [refresh]));
  const toggle = (id: string) => setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const create = async () => {
    try { const id = await savePlan(name, selected); setCreating(false); setName(''); setSelected([]); await refresh(); Alert.alert('Plan saved', 'Your workout plan is stored on this phone.'); }
    catch (e) { Alert.alert('Check your plan', e instanceof Error ? e.message : 'Could not save plan.'); }
  };
  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.muscle_group ?? '').toLowerCase().includes(search.toLowerCase()));
  return <Screen>
    <View style={styles.header}><SectionTitle eyebrow="BUILD YOUR ROUTINE" title="Workout plans" /><Pressable style={styles.primary} onPress={() => setCreating(v => !v)}><Text style={styles.primaryText}>{creating ? 'Cancel' : '+ Create'}</Text></Pressable></View>
    {creating && <Surface style={styles.form}>
      <Text style={styles.label}>PLAN NAME</Text><TextInput value={name} onChangeText={setName} placeholder="e.g. Leg Day" placeholderTextColor={theme.colors.muted} style={styles.input}/>
      <Text style={styles.label}>CHOOSE EXERCISES · {selected.length} SELECTED</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Search exercises or muscle group" placeholderTextColor={theme.colors.muted} style={styles.input}/>
      <ScrollView style={{maxHeight:260}} nestedScrollEnabled>{filtered.map(e => <Pressable key={e.id} onPress={() => toggle(e.id)} style={styles.exercisePick}><View style={[styles.check, selected.includes(e.id) && styles.checked]}>{selected.includes(e.id) && <Text style={styles.checkText}>✓</Text>}</View><View style={{flex:1}}><Text style={styles.exerciseName}>{e.name}</Text><Text style={styles.muted}>{e.muscle_group} · {e.equipment}</Text></View></Pressable>)}</ScrollView>
      <Pressable style={styles.primaryWide} onPress={create}><Text style={styles.primaryText}>Save workout plan</Text></Pressable>
      <Text style={styles.hint}>Each exercise starts with a target of 3 sets × 8–12 reps. You can adjust targets in a later phase.</Text>
    </Surface>}
    <View style={{gap:12}}>{plans.map(plan => <Surface key={plan.id} style={styles.planCard}><View style={{flex:1,gap:5}}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.muted}>{plan.exercise_count} exercises · saved on this device</Text></View><Pressable style={styles.start} onPress={() => router.push({pathname:'/workout',params:{planId:plan.id,planName:plan.name}})}><Text style={styles.startText}>Start</Text></Pressable></Surface>)}</View>
    {plans.length === 0 && !creating && <Surface style={styles.empty}><Text style={styles.emptyTitle}>Your first plan starts here</Text><Text style={styles.muted}>Create a routine, select exercises, and reuse it every time you train.</Text><Pressable style={styles.primaryWide} onPress={() => setCreating(true)}><Text style={styles.primaryText}>Create your first plan</Text></Pressable></Surface>}
  </Screen>;
}
const styles = StyleSheet.create({header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},primary:{backgroundColor:theme.colors.accent,borderRadius:12,paddingHorizontal:15,paddingVertical:11},primaryText:{color:theme.colors.accentText,fontWeight:'900'},form:{gap:12,marginBottom:18},label:{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:theme.colors.muted},input:{backgroundColor:theme.colors.background,color:theme.colors.text,borderWidth:1,borderColor:theme.colors.border,borderRadius:12,paddingHorizontal:13,paddingVertical:12},exercisePick:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:10,borderBottomWidth:1,borderBottomColor:theme.colors.border},check:{width:22,height:22,borderRadius:7,borderWidth:1,borderColor:theme.colors.muted,alignItems:'center',justifyContent:'center'},checked:{backgroundColor:theme.colors.accent,borderColor:theme.colors.accent},checkText:{color:theme.colors.accentText,fontWeight:'900'},exerciseName:{color:theme.colors.text,fontWeight:'700'},muted:{color:theme.colors.muted,fontSize:12},primaryWide:{backgroundColor:theme.colors.accent,borderRadius:12,padding:14,alignItems:'center',alignSelf:'stretch'},hint:{fontSize:11,lineHeight:16,color:theme.colors.muted},planCard:{flexDirection:'row',alignItems:'center',gap:12},planName:{color:theme.colors.text,fontSize:17,fontWeight:'800'},start:{backgroundColor:theme.colors.surfaceRaised,paddingHorizontal:16,paddingVertical:10,borderRadius:10},startText:{color:theme.colors.accent,fontWeight:'900'},empty:{gap:12},emptyTitle:{fontSize:18,fontWeight:'800',color:theme.colors.text}});
