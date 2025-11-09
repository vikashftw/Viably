# Input Schema

`POST /analyze` expects the following JSON body:

{
  "feature_name": "string",        // Short name of the feature
  "description": "string",         // What the feature does
  "target_user": "string",         // Who this is for
  "business_goal": "string"        // What metric or outcome this should impact
}

All four fields are REQUIRED.
No extra fields.
