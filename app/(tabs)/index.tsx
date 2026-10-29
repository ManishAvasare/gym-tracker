import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Surface } from '@/components/Surface';
import { theme } from '@/constants/theme';
import { getActiveSession, listPlans, sessionSummary, WorkoutPlan } from '@/db/workouts';

export default function TodayScreen() {
  const router=useRouter(); const [active,setActive]=useState<{id:string;plan_id:string|null;name:string}|null>(null); const [plans,setPlans]=useState<WorkoutPlan[]>([]); const [summary,setSummary]=useState({workouts:0,totalSets:0});
  const refresh=useCallback(async()=>{try{setActive(await getActiveSession());setPlans(await listPlans());setSummary(await sessionSummary());}catch(e){Alert.alert('Could not load dashboard',String(e));}},[]);
  useFocusEffect(useCallback(()=>{refresh();},[refresh]));
  return <Screen>
    <View style={styles.topline}><Text style={styles.brand}>FORM / FITNESS</Text><View style={styles.localPill}><View style={styles.dot}/><Text style={styles.localText}>ON-DEVICE</Text></View></View>
    <SectionTitle eyebrow="YOUR TRAINING, YOUR DATA" title="Today" />
    <Surface style={{gap:12}}><Text style={styles.kicker}>{active?'SESSION IN PROGRESS':'READY WHEN YOU ARE'}</Text><Text style={styles.cardTitle}>{active?active.name:'Make today count.'}</Text><Text style={styles.body}>{active?'Your current session is saved locally. Pick up where you left off.':'Start a saved plan or begin a blank workout. Your sets will autosave to this phone.'}</Text>
      <Pressable style={styles.action} onPress={()=>active?router.push({pathname:'/workout',params:{sessionId:active.id,planId:active.plan_id??undefined,planName:active.name}}):router.push('/workout')}><Text style={styles.actionText}>{active?'RESUME WORKOUT':'START EMPTY WORKOUT'} →</Text></Pressable>
    </Surface>
    <View style={styles.statsRow}><Surface style={{flex:1}}><Text style={styles.statValue}>{summary.workouts}</Text><Text style={styles.statLabel}>WORKOUTS DONE</Text></Surface><Surface style={{flex:1}}><Text style={styles.statValue}>{summary.totalSets}</Text><Text style={styles.statLabel}>SETS LOGGED</Text></Surface></View>
    <SectionTitle eyebrow="QUICK START" title="Your plans" />
    {plans.slice(0,3).map(plan=><Pressable key={plan.id} onPress={()=>router.push({pathname:'/workout',params:{planId:plan.id,planName:plan.name}})}><Surface style={styles.plan}><View style={{flex:1}}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.body}>{plan.exercise_count} exercises</Text></View><Text style={styles.actionText}>START →</Text></Surface></Pressable>)}
    {plans.length===0&&<Surface><Text style={styles.cardTitleSmall}>No saved plans yet</Text><Text style={styles.body}>Create your first routine in the Plans tab. You can also start a blank workout above.</Text><Pressable onPress={()=>router.push('/(tabs)/plans')} style={styles.action}><Text style={styles.actionText}>CREATE A PLAN →</Text></Pressable></Surface>}
  </Screen>;
}
const styles=StyleSheet.create({topline:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{color:theme.colors.muted,fontSize:11,letterSpacing:2,fontWeight:'900'},localPill:{flexDirection:'row',alignItems:'center',gap:6,borderColor:theme.colors.border,borderWidth:1,borderRadius:100,paddingHorizontal:10,paddingVertical:6},dot:{width:6,height:6,borderRadius:4,backgroundColor:theme.colors.accent},localText:{color:theme.colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1},kicker:{color:theme.colors.accent,fontSize:10,fontWeight:'900',letterSpacing:1.5},cardTitle:{color:theme.colors.text,fontSize:25,fontWeight:'800'},cardTitleSmall:{color:theme.colors.text,fontSize:16,fontWeight:'800'},body:{color:theme.colors.muted,fontSize:13,lineHeight:20},action:{alignSelf:'flex-start',backgroundColor:theme.colors.surfaceRaised,borderRadius:9,paddingHorizontal:11,paddingVertical:10,marginTop:4},actionText:{color:theme.colors.accent,fontSize:10,fontWeight:'900',letterSpacing:.5},statsRow:{flexDirection:'row',gap:12},statValue:{color:theme.colors.text,fontSize:25,fontWeight:'800'},statLabel:{color:theme.colors.muted,fontSize:10,letterSpacing:1,fontWeight:'800'},plan:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},planName:{fontSize:16,color:theme.colors.text,fontWeight:'800'}});
