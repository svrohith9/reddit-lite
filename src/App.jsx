import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString()
}

function App() {
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState({})
  const [newPost, setNewPost] = useState({ title: '', body: '' })
  const [newComment, setNewComment] = useState({})
  const [loading, setLoading] = useState(false)
  const [savingPost, setSavingPost] = useState(false)
  const [savingComment, setSavingComment] = useState({})

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [posts],
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: postRows, error: postError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postError) {
        console.error('Error loading posts', postError)
        setLoading(false)
        return
      }

      const { data: commentRows, error: commentError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true })

      if (commentError) {
        console.error('Error loading comments', commentError)
      }

      const grouped = {}
      ;(commentRows ?? []).forEach((row) => {
        if (!grouped[row.post_id]) grouped[row.post_id] = []
        grouped[row.post_id].push(row)
      })

      setPosts(postRows ?? [])
      setComments(grouped)
      setLoading(false)
    }

    load()
  }, [])

  const createPost = async () => {
    if (!newPost.title.trim()) return
    setSavingPost(true)
    const { data, error } = await supabase
      .from('posts')
      .insert({ title: newPost.title, body: newPost.body })
      .select()
      .single()

    if (error) {
      console.error('Error creating post', error)
    } else if (data) {
      setPosts([data, ...posts])
      setNewPost({ title: '', body: '' })
    }
    setSavingPost(false)
  }

  const createComment = async (postId) => {
    const body = newComment[postId]?.trim()
    if (!body) return

    setSavingComment((prev) => ({ ...prev, [postId]: true }))
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, body })
      .select()
      .single()

    if (error) {
      console.error('Error creating comment', error)
    } else if (data) {
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data],
      }))
      setNewComment((prev) => ({ ...prev, [postId]: '' }))
    }
    setSavingComment((prev) => ({ ...prev, [postId]: false }))
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Open source • GitHub Pages</p>
          <h1>Reddit Lite</h1>
          <p className="lede">Create threads, add comments, and iterate fast with Supabase.</p>
        </div>
        <div className="pill">Connected to Supabase</div>
      </header>

      <section className="panel">
        <h2>New post</h2>
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
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Threads</h2>
          {loading && <span className="pill muted">Loading…</span>}
        </div>

        {!loading && sortedPosts.length === 0 ? (
          <p className="muted">No posts yet. Start the conversation above.</p>
        ) : (
          <div className="stack">
            {sortedPosts.map((post) => (
              <article key={post.id} className="card">
                <div className="card-head">
                  <div>
                    <p className="eyebrow">Posted {formatDate(post.created_at)}</p>
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
                        <span className="muted">{formatDate(comment.created_at)}</span>
                      </div>
                    ))}
                    {(comments[post.id] || []).length === 0 && (
                      <p className="muted">No comments yet.</p>
                    )}
                  </div>
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
                  </div>
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
