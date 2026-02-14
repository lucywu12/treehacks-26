export default function Home() {
  return (
    <main style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px',
      padding: '24px'
    }}>
      <h1 style={{fontSize: '2.25rem', margin: 0}}>TreeHacks Frontend</h1>
      <p style={{color: '#444', maxWidth: 640, textAlign: 'center'}}>
        A minimal Next.js starter you can deploy to Vercel. Edit <strong>pages/index.js</strong> to get started.
      </p>
      <div style={{display: 'flex', gap: '12px'}}>
        <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{padding: '10px 14px', background: '#000', color: '#fff', borderRadius: 8, textDecoration: 'none'}}>Deploy on Vercel</a>
        <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" style={{padding: '10px 14px', background: '#eee', color: '#000', borderRadius: 8, textDecoration: 'none'}}>Next.js Docs</a>
      </div>
    </main>
  )
}
