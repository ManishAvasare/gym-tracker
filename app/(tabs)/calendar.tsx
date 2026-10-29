import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Surface } from '@/components/Surface';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/db/database';

type SessionRow = { id: string; name: string; started_at: string; completed_at: string | null; is_deload: number; set_count: number; volume: number };
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

export default function CalendarScreen() {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const rows = await db.getAllAsync<SessionRow>(`SELECT s.id,s.name,s.started_at,s.completed_at,s.is_deload,
        (SELECT COUNT(*) FROM workout_sets ws WHERE ws.session_id=s.id AND ws.completed_at IS NOT NULL) AS set_count,
        (SELECT COALESCE(SUM(ws.weight*ws.reps),0) FROM workout_sets ws WHERE ws.session_id=s.id AND ws.completed_at IS NOT NULL AND ws.set_type='working') AS volume
        FROM workout_sessions s WHERE s.status='completed' ORDER BY s.completed_at DESC`);
      setSessions(rows);
    } catch (e) { console.warn('Could not load workout calendar', e); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionRow[]> = {};
    sessions.forEach(s => { const key = dateKey(new Date(s.completed_at || s.started_at)); (map[key] ||= []).push(s); });
    return map;
  }, [sessions]);
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = first.getDay();
    const count = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
    return [...Array(start).fill(null), ...Array.from({length:count}, (_,i)=>i+1)];
  }, [month]);
  const selectedSessions = sessionsByDate[selected] || [];
  const monthSessions = sessions.filter(s => { const d = new Date(s.completed_at || s.started_at); return d.getFullYear()===month.getFullYear() && d.getMonth()===month.getMonth(); });
  const moveMonth = (delta: number) => { const next = new Date(month.getFullYear(), month.getMonth()+delta, 1); setMonth(next); setSelected(dateKey(next)); };

  return <Screen>
    <SectionTitle eyebrow="Consistency over time" title="Calendar" />
    <Surface>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => moveMonth(-1)} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.monthTitle}>{monthNames[month.getMonth()]} {month.getFullYear()}</Text>
        <Pressable onPress={() => moveMonth(1)} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>
      <View style={styles.grid}>
        {['S','M','T','W','T','F','S'].map((d,i)=><Text key={`${d}${i}`} style={styles.weekday}>{d}</Text>)}
        {days.map((day,i) => {
          if (!day) return <View key={`blank-${i}`} style={styles.dayCell}/>;
          const key = dateKey(new Date(month.getFullYear(),month.getMonth(),day));
          const hasWorkout = !!sessionsByDate[key]?.length;
          const isSelected = key === selected;
          const isToday = key === dateKey(new Date());
          return <Pressable key={key} onPress={() => setSelected(key)} style={[styles.dayCell, isSelected && styles.selectedDay, isToday && !isSelected && styles.todayDay]}>
            <Text style={[styles.dayText,isSelected && styles.selectedDayText]}>{day}</Text>
            {hasWorkout ? <View style={[styles.dot,isSelected && styles.selectedDot]}/> : <View style={styles.dotPlaceholder}/>}
          </Pressable>;
        })}
      </View>
      <View style={styles.legend}><View style={styles.dot}/><Text style={styles.muted}>Completed workout</Text><Text style={styles.monthCount}>{monthSessions.length} this month</Text></View>
    </Surface>
    <Surface>
      <Text style={styles.sectionTitle}>{new Date(`${selected}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</Text>
      {loading ? <Text style={styles.muted}>Loading history…</Text> : selectedSessions.length === 0 ? <Text style={styles.body}>No completed workouts on this date. Choose a marked day to review your session.</Text> : selectedSessions.map(s=><View key={s.id} style={styles.sessionRow}>
        <View style={styles.sessionIcon}><Text style={styles.sessionIconText}>{s.is_deload ? 'D' : '✓'}</Text></View>
        <View style={styles.sessionInfo}><Text style={styles.sessionName}>{s.name}{s.is_deload ? ' · Deload' : ''}</Text><Text style={styles.muted}>{s.set_count} completed sets · {Math.round(s.volume).toLocaleString()} kg·reps</Text><Text style={styles.muted}>{new Date(s.started_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} start</Text></View>
      </View>)}
    </Surface>
  </Screen>;
}
const styles = StyleSheet.create({monthHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},monthTitle:{color:theme.colors.text,fontWeight:'800',fontSize:18},arrow:{width:36,height:36,borderRadius:12,backgroundColor:theme.colors.surfaceRaised,alignItems:'center',justifyContent:'center'},arrowText:{color:theme.colors.text,fontSize:28,marginTop:-4},grid:{flexDirection:'row',flexWrap:'wrap'},weekday:{width:'14.2857%',textAlign:'center',color:theme.colors.muted,fontSize:12,fontWeight:'800',paddingBottom:10},dayCell:{width:'14.2857%',height:43,alignItems:'center',justifyContent:'center',borderRadius:12,marginBottom:3},selectedDay:{backgroundColor:theme.colors.accent},todayDay:{borderWidth:1,borderColor:theme.colors.accent},dayText:{color:theme.colors.text,fontWeight:'600'},selectedDayText:{color:theme.colors.accentText,fontWeight:'900'},dot:{width:5,height:5,borderRadius:3,backgroundColor:theme.colors.accent,marginTop:3},selectedDot:{backgroundColor:theme.colors.accentText},dotPlaceholder:{height:8},legend:{flexDirection:'row',alignItems:'center',gap:7,marginTop:12},muted:{color:theme.colors.muted,fontSize:12},monthCount:{marginLeft:'auto',color:theme.colors.text,fontWeight:'700',fontSize:12},sectionTitle:{color:theme.colors.text,fontSize:17,fontWeight:'800'},body:{color:theme.colors.muted,fontSize:14,lineHeight:21},sessionRow:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:10},sessionIcon:{width:36,height:36,borderRadius:12,backgroundColor:theme.colors.surfaceRaised,alignItems:'center',justifyContent:'center'},sessionIconText:{color:theme.colors.accent,fontWeight:'900'},sessionInfo:{flex:1,gap:3},sessionName:{color:theme.colors.text,fontSize:15,fontWeight:'800'}});
