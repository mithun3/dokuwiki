import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="wiki-content">
      <h1>Audio / Recording / Sounds / Technology</h1>
      
      <p className="text-xl text-gray-600 mb-8">
        Welcome to the field recording and audio technology wiki.
      </p>

      <div className="grid gap-6 md:grid-cols-2 my-8">
        <Link 
          href="/recording" 
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow no-underline"
        >
          <h2 className="text-2xl font-bold mb-2 text-blue-600">🎙️ Recording</h2>
          <p className="text-gray-600">
            Field recording techniques, equipment guides, and best practices.
          </p>
        </Link>

        <Link 
          href="/sounds" 
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow no-underline"
        >
          <h2 className="text-2xl font-bold mb-2 text-blue-600">🔊 Sounds</h2>
          <p className="text-gray-600">
            Sound libraries, samples, and audio resources.
          </p>
        </Link>
      </div>

      <section className="mt-12 p-6 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-lg font-semibold mb-3 text-amber-900">About Me</h3>
        <p className="text-gray-700 leading-relaxed">
          By day, I navigate the corporate world. By night, I&rsquo;m a freelance audio consultant&mdash;specializing in recording, sound design, and field audio work. Whether it&rsquo;s remote capture, on-location spot recording, or immersive ambient soundscaping, I bring studio-grade discipline and creative insight to every project. This library reflects multiple decades of field expertise, gear knowledge, and the sonic techniques that separate good recordings from exceptional ones.
        </p>
      </section>

      <section className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">About This Wiki</h3>
        <p className="text-gray-700">
          This wiki documents field recording techniques, equipment, and sound libraries 
          for audio professionals and enthusiasts. Navigate using the sidebar or explore 
          the sections above.
        </p>
      </section>
    </div>
  );
}
