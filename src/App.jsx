import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './pages/Landing';
import Test from './pages/Test';
import Loading from './pages/Loading';
import Result from './pages/Result';
import About from './pages/About';
import Archetypes from './pages/Archetypes';
import Traits from './pages/Traits';
import Questions from './pages/Questions';
import History from './pages/History';
import SharedProfile from './pages/SharedProfile';
import { generateResult } from './utils/blurEngine';
import { questions } from './data/questions';
import { getHistoryRecords, getAllHistoryRecords, saveHistoryRecord } from './utils/historyStorage';
import { syncRecord, flushPending, refreshCloudHistory, removeRecord } from './utils/cloud';

const LOADING_DURATION = 3500;
const pages = ['landing', 'about', 'archetypes', 'traits', 'questions', 'history', 'test', 'loading', 'result', 'view', 'compare'];

function readRoute() {
  const [screen, id] = window.location.hash.slice(1).split('/');
  if (['view', 'compare'].includes(screen)) {
    return /^[a-f0-9]{32}$/.test(id || '') ? { screen, id } : { screen: 'landing' };
  }
  if (screen === 'result') return getHistoryRecords().some((record) => record.id === id)
    ? { screen, id } : { screen: 'history' };
  return { screen: ['about', 'archetypes', 'traits', 'questions', 'history'].includes(screen) ? screen : 'landing' };
}

const pageVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.97, filter: 'blur(2px)' }),
  center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.97, filter: 'blur(2px)' }),
};

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [direction, setDirection] = useState(1);
  const [records, setRecords] = useState(getHistoryRecords);
  const [unsavedResult, setUnsavedResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [peer, setPeer] = useState(null);
  const [comparisonRecordId, setComparisonRecordId] = useState(null);
  const loadingTimer = useRef(null);
  const comparisonTarget = useRef(null);

  const navigate = useCallback((screen, id) => {
    setDirection(pages.indexOf(screen) > pages.indexOf(route.screen) ? 1 : -1);
    setRoute({ screen, id });
    window.history.pushState(null, '', screen === 'landing'
      ? window.location.pathname + window.location.search : `#${screen}${id ? `/${id}` : ''}`);
  }, [route.screen]);

  useEffect(() => {
    const changed = () => setRecords(getHistoryRecords());
    const back = () => {
      clearTimeout(loadingTimer.current);
      setRoute(readRoute());
    };
    const retry = () => { flushPending().catch(() => {}); };
    window.addEventListener('blur-history-change', changed);
    window.addEventListener('storage', changed);
    window.addEventListener('popstate', back);
    window.addEventListener('hashchange', back);
    window.addEventListener('online', retry);
    retry();
    return () => {
      clearTimeout(loadingTimer.current);
      window.removeEventListener('blur-history-change', changed);
      window.removeEventListener('storage', changed);
      window.removeEventListener('popstate', back);
      window.removeEventListener('hashchange', back);
      window.removeEventListener('online', retry);
    };
  }, []);

  useEffect(() => {
    if (route.screen !== 'history') return;
    let active = true;
    refreshCloudHistory().then(() => { if (active) setNotice(''); })
      .catch(() => { if (active) setNotice('云端暂不可用，正在显示本机历史。'); });
    return () => { active = false; };
  }, [route.screen]);

  const home = () => {
    clearTimeout(loadingTimer.current);
    comparisonTarget.current = null;
    navigate('landing');
  };

  const start = (shareId = null) => {
    comparisonTarget.current = shareId;
    setComparisonRecordId(null);
    setUnsavedResult(null);
    navigate('test');
  };

  const complete = (answers) => {
    navigate('loading');
    clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => {
      const result = generateResult(answers, questions);
      const saved = saveHistoryRecord(answers, result, 'pending');
      const target = comparisonTarget.current;
      comparisonTarget.current = null;
      if (!saved) {
        setUnsavedResult(result);
        setNotice('本机存储空间不足，画像暂未存档。请保留当前页面。');
        navigate('result');
        return;
      }
      syncRecord(saved).catch(() => {});
      if (target) { setComparisonRecordId(saved.id); navigate('compare', target); }
      else navigate('result', saved.id);
    }, LOADING_DURATION);
  };

  const openHistory = () => {
    navigate('history');
  };
  const remove = async (id) => {
    const record = records.find((item) => item.id === id);
    try { await removeRecord(record); setNotice(''); }
    catch { setNotice('本机记录已隐藏，云端删除待确认；公开链接可能仍可访问。恢复连接后会重试。'); }
  };
  const clear = async () => {
    let pending = false;
    for (const record of records) {
      try { await removeRecord(record); } catch { pending = true; }
    }
    setNotice(pending ? '部分云端删除待确认，公开链接可能仍可访问。' : '');
  };
  const record = records.find((item) => item.id === route.id);
  let content;
  switch (route.screen) {
    case 'about': content = <About onBack={home} onOpenArchetypes={() => navigate('archetypes')} onOpenTraits={() => navigate('traits')} onOpenQuestions={() => navigate('questions')} />; break;
    case 'archetypes': content = <Archetypes onBack={() => navigate('about')} />; break;
    case 'traits': content = <Traits onBack={() => navigate('about')} />; break;
    case 'questions': content = <Questions onBack={() => navigate('about')} />; break;
    case 'history': content = <History records={records} notice={notice}
      pendingDeletes={getAllHistoryRecords().filter((item) => item.deletedAt).length}
      onRetry={() => refreshCloudHistory().then(() => setNotice('同步完成')).catch((error) => setNotice(error.message))}
      onBack={home} onOpen={(item) => navigate('result', item.id)} onDelete={remove} onClear={clear} />; break;
    case 'test': content = <Test onComplete={complete} />; break;
    case 'loading': content = <Loading />; break;
    case 'result': content = record || unsavedResult
      ? <Result result={record?.result || unsavedResult} record={record} onRestart={home} />
      : <History records={records} onBack={home} onOpen={(item) => navigate('result', item.id)} onDelete={remove} onClear={clear} />; break;
    case 'view':
    case 'compare': content = <SharedProfile shareId={route.id} mode={route.screen} records={records} selectedRecordId={comparisonRecordId}
      cached={peer?.shareId === route.id ? peer.profile : null}
      onLoaded={(profile) => setPeer({ shareId: route.id, profile })}
      onHome={home} onCompare={() => { setComparisonRecordId(null); navigate('compare', route.id); }} onView={() => navigate('view', route.id)}
      onStart={() => start(route.id)} />; break;
    default: content = <Landing onStart={() => start()} onExplore={() => navigate('about')} onOpenHistory={openHistory} />;
  }

  return <div className="min-h-[100svh] bg-blur-bg">
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div key={`${route.screen}/${route.id || ''}`} custom={direction} variants={pageVariants}
        initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ willChange: 'filter, transform, opacity', contain: 'layout style paint' }}>
        {content}
      </motion.div>
    </AnimatePresence>
  </div>;
}
