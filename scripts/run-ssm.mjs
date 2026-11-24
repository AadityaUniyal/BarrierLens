import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const commands = process.argv.slice(2);
if (commands.length === 0) {
  console.error('Please provide commands to run');
  process.exit(1);
}

const params = {
  InstanceIds: ['i-04ebcf4c1a1f66f7f'],
  DocumentName: 'AWS-RunShellScript',
  Parameters: {
    commands: commands
  }
};

const tempJson = path.resolve('scripts/ssm-cmd.json');
fs.writeFileSync(tempJson, JSON.stringify(params, null, 2));

try {
  const sendOut = execSync(`aws ssm send-command --cli-input-json file://${tempJson.replace(/\\/g, '/')} --region ap-south-1 --query "Command.CommandId" --output text`, {
    encoding: 'utf8'
  }).trim();

  console.log(`SSM Command sent. ID: ${sendOut}`);

  // Wait for command execution
  let finished = false;
  let attempts = 0;
  while (!finished && attempts < 30) {
    execSync('powershell -Command "Start-Sleep -Seconds 2"');
    attempts++;
    try {
      const statusOut = execSync(`aws ssm get-command-invocation --command-id ${sendOut} --instance-id i-04ebcf4c1a1f66f7f --region ap-south-1 --query "{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}" --output json`, {
        encoding: 'utf8'
      });
      const res = JSON.parse(statusOut);
      if (res.Status === 'Success' || res.Status === 'Failed' || res.Status === 'Cancelled' || res.Status === 'TimedOut') {
        finished = true;
        console.log(`Status: ${res.Status}`);
        if (res.Output) console.log(`Output:\n${res.Output}`);
        if (res.Error) console.error(`Error:\n${res.Error}`);
      } else {
        process.stdout.write('.');
      }
    } catch (e) {
      process.stdout.write('?');
    }
  }
} finally {
  try { fs.unlinkSync(tempJson); } catch {}
}
