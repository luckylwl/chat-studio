/**
 * Content Creation Studio Component
 *
 * Generate social media posts, blogs, ads with SEO optimization
 */

import React, { useState } from 'react';
import { contentCreationService, ContentRequest, ContentPlatform, ContentTone } from '../services/contentCreationService';

const PLATFORMS: ContentPlatform[] = [
  'twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'blog'
];

const CONTENT_TYPES = [
  'social_post', 'blog_article', 'ad_copy', 'email', 'product_description', 'video_script'
];

const TONES: ContentTone[] = [
  'professional', 'casual', 'humorous', 'formal', 'inspirational', 'educational'
];

export const ContentStudio: React.FC = () => {
  const [contentType, setContentType] = useState('social_post');
  const [platform, setPlatform] = useState<ContentPlatform>('twitter');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ContentTone>('professional');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [contentHistory, setContentHistory] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const request: ContentRequest = {
        type: contentType,
        topic: topic.trim(),
        platform: contentType === 'social_post' ? platform : undefined,
        tone,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
      };

      const result = await contentCreationService.generateContent(request);
      setGeneratedContent(result);
      setContentHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Content generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeSEO = async () => {
    if (!generatedContent) return;

    try {
      const keywords = generatedContent.metadata.keywords || [];
      const seoAnalysis = await contentCreationService.optimizeForSEO(
        generatedContent.content,
        keywords
      );
      setGeneratedContent({
        ...generatedContent,
        seoAnalysis,
      });
    } catch (error) {
      console.error('SEO optimization failed:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      linkedin: '💼',
      instagram: '📷',
      facebook: '👥',
      tiktok: '🎵',
      youtube: '📺',
      blog: '📝',
    };
    return icons[platform] || '📄';
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-orange-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">✍️ Content Creation Studio</h2>
        <p className="opacity-90">
          Generate high-quality content for any platform with AI-powered SEO optimization
        </p>
      </div>

      {/* Content Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Create Content</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {contentType === 'social_post' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {getPlatformIcon(p)} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ContentTone)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic / Subject
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'New product launch announcement'"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (comma-separated, optional)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., 'AI, innovation, technology'"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? 'Generating...' : 'Generate Content'}
        </button>
      </div>

      {/* Generated Content */}
      {generatedContent && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-xl font-semibold">Generated Content</h3>
            <div className="flex gap-2">
              <button
                onClick={handleOptimizeSEO}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Analyze SEO
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedContent.content);
                }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {generatedContent.content}
            </div>
          </div>

          {/* Metadata */}
          {generatedContent.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {generatedContent.metadata.wordCount || 0}
                </div>
                <div className="text-sm text-gray-600">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {generatedContent.metadata.characterCount || 0}
                </div>
                <div className="text-sm text-gray-600">Characters</div>
              </div>
              {generatedContent.metadata.readingTime && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {generatedContent.metadata.readingTime}
                  </div>
                  <div className="text-sm text-gray-600">Min Read</div>
                </div>
              )}
              {generatedContent.metadata.seoScore && (
                <div className="text-center">
                  <div className={`text-2xl font-bold px-3 py-1 rounded ${getSEOScoreColor(generatedContent.metadata.seoScore)}`}>
                    {generatedContent.metadata.seoScore}
                  </div>
                  <div className="text-sm text-gray-600">SEO Score</div>
                </div>
              )}
            </div>
          )}

          {/* SEO Analysis */}
          {generatedContent.seoAnalysis && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-3">SEO Analysis</h4>
              <div className="space-y-3">
                {generatedContent.seoAnalysis.suggestions.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Suggestions:</div>
                    <ul className="space-y-1">
                      {generatedContent.seoAnalysis.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {generatedContent.seoAnalysis.keywords && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Keyword Density:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(generatedContent.seoAnalysis.keywords).map(([keyword, count]) => (
                        <span key={keyword} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {keyword}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variations */}
          {generatedContent.variations && generatedContent.variations.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-3">
                Alternative Versions ({generatedContent.variations.length})
              </h4>
              <div className="space-y-2">
                {generatedContent.variations.map((variation: string, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setGeneratedContent({
                      ...generatedContent,
                      content: variation,
                    })}
                  >
                    <div className="text-sm text-gray-700">{variation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content History */}
      {contentHistory.length > 0 && !generatedContent && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Content</h3>
          <div className="space-y-3">
            {contentHistory.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setGeneratedContent(item)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all"
              >
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {item.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{item.metadata.wordCount} words</span>
                  <span>•</span>
                  <span>
                    {item.metadata.seoScore ? `SEO: ${item.metadata.seoScore}` : 'No SEO analysis'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {!generatedContent && contentHistory.length === 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
          <h3 className="font-semibold text-pink-900 mb-3">Content Studio Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-pink-800">
            <ul className="space-y-2">
              <li>✓ Social media posts for 7 platforms</li>
              <li>✓ Blog articles with SEO optimization</li>
              <li>✓ Ad copy for marketing campaigns</li>
            </ul>
            <ul className="space-y-2">
              <li>✓ Email templates and newsletters</li>
              <li>✓ Product descriptions</li>
              <li>✓ Video scripts for YouTube/TikTok</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentStudio;
