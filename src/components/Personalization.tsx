/**
 * AI Personalization Component (v4.0)
 *
 * Adaptive responses based on user preferences and behavior
 */

import React, { useState, useEffect } from 'react';
import { personalizationService, UserProfile, InteractionRecord } from '../services/personalizationService';

export const Personalization: React.FC = () => {
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [baseResponse, setBaseResponse] = useState('');
  const [adaptedResponse, setAdaptedResponse] = useState<any>(null);
  const [interactionHistory, setInteractionHistory] = useState<InteractionRecord[]>([]);

  // Preference form
  const [preferences, setPreferences] = useState({
    responseStyle: 'balanced',
    formality: 'moderate',
    technicality: 'moderate',
    customInstructions: '',
  });

  useEffect(() => {
    // Create or load profile
    const existingProfile = personalizationService.getProfile(userId);
    if (existingProfile) {
      setProfile(existingProfile);
      setPreferences({
        responseStyle: existingProfile.preferences.responseStyle,
        formality: existingProfile.preferences.formality,
        technicality: existingProfile.preferences.technicality,
        customInstructions: existingProfile.preferences.customInstructions || '',
      });
    } else {
      const newProfile = personalizationService.createProfile(userId);
      setProfile(newProfile);
    }
  }, [userId]);

  const handleUpdatePreferences = () => {
    personalizationService.updatePreferences(userId, preferences);
    const updatedProfile = personalizationService.getProfile(userId);
    setProfile(updatedProfile);
  };

  const handleAdaptResponse = async () => {
    if (!baseResponse.trim()) return;

    const result = await personalizationService.adaptResponse(userId, baseResponse, {
      topic: 'general',
      complexity: 'medium',
    });

    setAdaptedResponse(result);

    // Record interaction
    await personalizationService.learnFromInteraction(userId, {
      messageType: 'query',
      topic: 'general',
      duration: 0,
      satisfaction: undefined,
    });

    const updatedProfile = personalizationService.getProfile(userId);
    setProfile(updatedProfile);
  };

  const handleRecordInteraction = async (satisfaction: number) => {
    await personalizationService.learnFromInteraction(userId, {
      messageType: 'query',
      topic: 'general',
      duration: Math.floor(Math.random() * 120) + 30,
      satisfaction,
    });

    const updatedProfile = personalizationService.getProfile(userId);
    setProfile(updatedProfile);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-700 to-rose-700 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">🎯 AI Personalization (v4.0)</h2>
        <p className="opacity-90">
          Adaptive AI responses based on your preferences and behavior patterns
        </p>
      </div>

      {/* User Profile Overview */}
      {profile && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Your Profile</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-pink-50 rounded">
              <div className="text-2xl font-bold text-pink-600">
                {profile.interactionHistory.length}
              </div>
              <div className="text-sm text-gray-600">Interactions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {profile.personality.traits.length}
              </div>
              <div className="text-sm text-gray-600">Traits</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {profile.personality.interests.length}
              </div>
              <div className="text-sm text-gray-600">Interests</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Member Since</div>
            </div>
          </div>

          {profile.personality.traits.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Detected Traits</h4>
              <div className="flex flex-wrap gap-2">
                {profile.personality.traits.map((trait, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.personality.interests.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {profile.personality.interests.map((interest, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preferences Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Configure Preferences</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Style
          </label>
          <select
            value={preferences.responseStyle}
            onChange={(e) => setPreferences({ ...preferences, responseStyle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="concise">Concise - Brief and to the point</option>
            <option value="detailed">Detailed - Comprehensive explanations</option>
            <option value="balanced">Balanced - Mix of both</option>
            <option value="conversational">Conversational - Friendly and engaging</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formality Level
          </label>
          <select
            value={preferences.formality}
            onChange={(e) => setPreferences({ ...preferences, formality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="casual">Casual - Relaxed and informal</option>
            <option value="moderate">Moderate - Professional but friendly</option>
            <option value="formal">Formal - Strictly professional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technical Detail
          </label>
          <select
            value={preferences.technicality}
            onChange={(e) => setPreferences({ ...preferences, technicality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="beginner">Beginner - Simple explanations</option>
            <option value="moderate">Moderate - Some technical terms</option>
            <option value="advanced">Advanced - Full technical depth</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions
          </label>
          <textarea
            value={preferences.customInstructions}
            onChange={(e) => setPreferences({ ...preferences, customInstructions: e.target.value })}
            placeholder="Add any custom instructions for how AI should respond to you..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
            rows={4}
          />
        </div>

        <button
          onClick={handleUpdatePreferences}
          className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
        >
          Save Preferences
        </button>
      </div>

      {/* Test Adaptation */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Test Response Adaptation</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Response
          </label>
          <textarea
            value={baseResponse}
            onChange={(e) => setBaseResponse(e.target.value)}
            placeholder="Enter a generic AI response to see how it gets adapted to your preferences..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
            rows={4}
          />
        </div>

        <button
          onClick={handleAdaptResponse}
          disabled={!baseResponse.trim()}
          className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          Adapt Response
        </button>
      </div>

      {/* Adapted Response */}
      {adaptedResponse && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Adapted Response</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Original</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{adaptedResponse.original}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Personalized</h4>
              <div className="p-4 bg-pink-50 rounded-lg border-2 border-pink-200">
                <p className="text-gray-700">{adaptedResponse.adapted}</p>
              </div>
            </div>
          </div>

          {adaptedResponse.adaptations && adaptedResponse.adaptations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Adaptations Applied</h4>
              <ul className="space-y-1">
                {adaptedResponse.adaptations.map((adaptation: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {adaptation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-700 mb-3">How was this response?</h4>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRecordInteraction(rating)}
                  className="px-4 py-2 bg-gray-100 hover:bg-pink-100 rounded-lg transition-colors"
                >
                  {'⭐'.repeat(rating)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {!profile && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
          <h3 className="font-semibold text-pink-900 mb-3">AI Personalization Features (v4.0)</h3>
          <ul className="space-y-2 text-sm text-pink-800">
            <li>✓ Learn from your interaction patterns</li>
            <li>✓ Adapt responses to your preferred style</li>
            <li>✓ Customize formality and technical level</li>
            <li>✓ Automatic trait and interest detection</li>
            <li>✓ Custom instructions support</li>
            <li>✓ Continuous learning from feedback</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Personalization;
