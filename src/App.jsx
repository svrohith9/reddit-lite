import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString()
}

const displayName = (email) => email || 'Someone'

function App() {
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState({})
  const [newPost, setNewPost] = useState({ title: '', body: '' })
  const [newComment, setNewComment] = useState({})
  const [loading, setLoading] = useState(false)
  const [savingPost, setSavingPost] = useState(false)
  const [savingComment, setSavingComment] = useState({})
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('signup')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [postError, setPostError] = useState('')
  const [commentError, setCommentError] = useState({})
  const [fetchError, setFetchError] = useState('')

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [posts],
  )

  const fetchData = useCallback(async () => {
    if (!user) {
      setPosts([])
      setComments({})
      setFetchError('')
      return
    }
    setLoading(true)
    setFetchError('')
    const { data: postRows, error: postError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (postError) {
      console.error('Error loading posts', postError)
      setFetchError(postError.message || 'Unable to load posts')
      setLoading(false)
      return
    }

    const { data: commentRows, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    if (commentError) {
      console.error('Error loading comments', commentError)
      setFetchError(commentError.message || 'Unable to load comments')
    }

    const grouped = {}
    ;(commentRows ?? []).forEach((row) => {
      if (!grouped[row.post_id]) grouped[row.post_id] = []
      grouped[row.post_id].push(row)
    })

    setPosts(postRows ?? [])
    setComments(grouped)
    setLoading(false)
  }, [user])

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
    }
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setAuthError('')
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, user?.id])

  const createPost = async () => {
    if (!user || !newPost.title.trim()) return
    setSavingPost(true)
    setPostError('')
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: newPost.title,
        body: newPost.body,
        user_id: user.id,
        user_email: user.email,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating post', error)
      setPostError(error.message || 'Unable to create post')
    } else if (data) {
      setPosts([data, ...posts])
      setNewPost({ title: '', body: '' })
      setPostError('')
    }
    setSavingPost(false)
  }

  const createComment = async (postId) => {
    const body = newComment[postId]?.trim()
    if (!body || !user) return

    setSavingComment((prev) => ({ ...prev, [postId]: true }))
    setCommentError((prev) => ({ ...prev, [postId]: '' }))
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, body, user_id: user.id, user_email: user.email })
      .select()
      .single()

    if (error) {
      console.error('Error creating comment', error)
      setCommentError((prev) => ({ ...prev, [postId]: error.message || 'Unable to comment' }))
    } else if (data) {
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data],
      }))
      setNewComment((prev) => ({ ...prev, [postId]: '' }))
      setCommentError((prev) => ({ ...prev, [postId]: '' }))
    }
    setSavingComment((prev) => ({ ...prev, [postId]: false }))
  }

  const handleEmailAuth = async () => {
    if (!authForm.email || !authForm.password) {
      setAuthError('Email and password are required')
      return
    }
    setAuthError('')
    setAuthLoading(true)

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
      })
      if (error) setAuthError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      })
      if (error) setAuthError(error.message)
    }
    setAuthLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setNewPost({ title: '', body: '' })
    setNewComment({})
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Open source • GitHub Pages</p>
          <h1>Reddit Lite</h1>
          <p className="lede">Create threads, add comments, and iterate fast with Supabase.</p>
        </div>
        <div className="pill">
          {user ? (
            <>
              <span className="dot online" />
              {displayName(user.email)}
            </>
          ) : (
            'Auth required to post'
          )}
        </div>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>{user ? 'Account' : 'Sign in or create account'}</h2>
          {user && (
            <button className="secondary" onClick={signOut}>
              Sign out
            </button>
          )}
        </div>

        {!user ? (
          <div className="auth-grid">
            <div className="auth-tabs">
              <button
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => setAuthMode('signup')}
              >
                Email sign up
              </button>
              <button
                className={authMode === 'signin' ? 'active' : ''}
                onClick={() => setAuthMode('signin')}
              >
                Email sign in
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                />
              </label>
            </div>
            <button className="primary" onClick={handleEmailAuth} disabled={authLoading}>
              {authLoading
                ? 'Working…'
                : authMode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>
            {authError && <p className="error">{authError}</p>}
          </div>
        ) : (
          <div className="auth-grid">
            <p className="muted">
              Signed in as <strong>{user.email || user.id}</strong>. You can post and comment.
            </p>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>New post</h2>
        {!user ? (
          <p className="muted">Sign in to publish a post.</p>
        ) : (
          <>
            <div className="form-grid">
              <label className="field">
                <span>Title</span>
                <input
                  placeholder="What's on your mind?"
                  value={newPost.title}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Body</span>
                <textarea
                  rows={3}
                  placeholder="Share details"
                  value={newPost.body}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, body: e.target.value }))}
                />
              </label>
            </div>
            <button className="primary" onClick={createPost} disabled={savingPost}>
              {savingPost ? 'Posting…' : 'Publish post'}
            </button>
            {postError && <p className="error">{postError}</p>}
          </>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Threads</h2>
          {loading && user && <span className="pill muted">Loading…</span>}
        </div>

        {!user ? (
          <p className="muted">Sign in to view and join threads.</p>
        ) : fetchError ? (
          <p className="error">{fetchError}</p>
        ) : !loading && sortedPosts.length === 0 ? (
          <p className="muted">No posts yet. Start the conversation above.</p>
        ) : (
          <div className="stack">
            {sortedPosts.map((post) => (
              <article key={post.id} className="card">
                <div className="card-head">
                  <div>
                    <p className="eyebrow">
                      Posted {formatDate(post.created_at)}
                      {post.user_email ? ` • ${displayName(post.user_email)}` : ''}
                    </p>
                    <h3>{post.title}</h3>
                  </div>
                </div>
                {post.body && <p className="body">{post.body}</p>}

                <div className="comments">
                  <p className="eyebrow">Comments</p>
                  <div className="comment-stack">
                    {(comments[post.id] || []).map((comment) => (
                      <div key={comment.id} className="comment">
                        <p>{comment.body}</p>
                        <span className="muted">
                          {comment.user_email ? `${displayName(comment.user_email)} • ` : ''}
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                    ))}
                    {(comments[post.id] || []).length === 0 && (
                      <p className="muted">No comments yet.</p>
                    )}
                  </div>
                  {user ? (
                    <div className="comment-form">
                      <input
                        placeholder="Add a comment"
                        value={newComment[post.id] || ''}
                        onChange={(e) =>
                          setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => createComment(post.id)}
                        disabled={savingComment[post.id]}
                      >
                        {savingComment[post.id] ? 'Posting…' : 'Send'}
                      </button>
                      {commentError[post.id] && <p className="error">{commentError[post.id]}</p>}
                    </div>
                  ) : (
                    <p className="muted">Sign in to comment.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default App
