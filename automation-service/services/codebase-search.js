const RIPGREP_API_URL = process.env.RIPGREP_API_URL || 'http://localhost:3001';

export async function searchCodebase(searchContext, targetRepo) {
  try {
    const query = searchContext?.search_patterns?.join('|') || '';

    const response = await fetch(`${RIPGREP_API_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        path: targetRepo.local_path || './mock-repo',
        type: searchContext?.file_types?.[0] || 'tsx'
      })
    });

    if (!response.ok) {
      throw new Error(`Ripgrep API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      files_found: data.files || [],
      matches: data.matches || [],
      is_new_feature: data.files?.length === 0,
      total_matches: data.total || 0
    };
  } catch (error) {
    console.error('[Search] Ripgrep search failed:', error.message);
    return {
      files_found: [],
      matches: [],
      is_new_feature: true,
      total_matches: 0
    };
  }
}
