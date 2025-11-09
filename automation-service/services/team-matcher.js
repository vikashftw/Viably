import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let teamCache = null;

async function loadTeam() {
  if (!teamCache) {
    const data = await fs.readFile(
      path.join(__dirname, '../config/team.json'),
      'utf-8'
    );
    teamCache = JSON.parse(data);
  }
  return teamCache;
}

export async function assignTeam(tasks) {
  const team = await loadTeam();
  const assignments = [];
  const trainingNeeded = [];

  for (const task of tasks) {
    const requiredSkills = task.skills_required || [];

    const matches = team.engineers.filter(eng =>
      requiredSkills.some(skill => eng.skills.includes(skill))
    );

    if (matches.length > 0) {
      matches.sort((a, b) => a.current_capacity - b.current_capacity);
      const assigned = matches[0];

      assignments.push({
        task_id: task.id || task.title,
        engineer: assigned.name,
        email: assigned.email,
        matched_skills: requiredSkills.filter(s => assigned.skills.includes(s)),
        hours: task.estimated_hours || 0
      });
    } else {
      trainingNeeded.push({
        skill: requiredSkills[0],
        task: task.title,
        recommendation: `Training needed for ${requiredSkills[0]}`
      });

      const available = team.engineers.sort((a, b) => a.current_capacity - b.current_capacity)[0];
      assignments.push({
        task_id: task.id || task.title,
        engineer: available.name,
        email: available.email,
        matched_skills: [],
        hours: task.estimated_hours || 0,
        note: 'Training required'
      });
    }
  }

  return { assignments, training_needed: trainingNeeded };
}
