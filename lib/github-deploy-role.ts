import * as cdk from 'aws-cdk-lib';
import { Role, FederatedPrincipal, ManagedPolicy, PolicyStatement, Effect, PolicyDocument } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class GithubActionsRoleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the OIDC provider for GitHub
    const oidcProvider = new cdk.aws_iam.OpenIdConnectProvider(this, 'GithubOIDCProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com']
    });

    // Create the role
    const role = new Role(this, 'GithubActionsRole', {
      assumedBy: new FederatedPrincipal(oidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': [
              'repo:sghost13/sg-aws-github-oidc:environment:dev'
          ]
        },
        /** explicit branch naming like docs say does not work
        *   ie: repo:<USER>/<REPO>:ref/refs/heads/<BRANCH> will not work
        **/
//         StringLike:{
//           'token.actions.githubusercontent.com:sub': [
// //            'repo:<USER>/<REPO>:*'
//             'repo:sghost13/sg-aws-github-oidc:*'
//           ]
//         },
      },
      'sts:AssumeRoleWithWebIdentity'
    ),
      description: 'Role for Github Actions to deploy using CDK', // Description for the role
      roleName: 'GitHubActions', // Custom name for the role
      maxSessionDuration: cdk.Duration.hours(1), // Maximum duration for the role session
      // Inline policies attached to the role
      inlinePolicies: {
        GithubActionsPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'cloudformation:*',
                's3:ListBucket',
                's3:GetObject',
                's3:PutObject',
                'iam:PassRole',
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:DescribeParameters'
              ],
              resources: ['*'],
              effect: Effect.ALLOW,
              sid: 'AllowCDKDeployments'
            }),
            new PolicyStatement({
              actions: [
                'ec2:Describe*',
                'ec2:CreateTags',
                'ec2:DeleteTags'
              ],
              resources: ['*'],
              effect: Effect.ALLOW,
              sid: 'AllowEC2Operations'
            }),
            new PolicyStatement({
              actions: [
                'lambda:CreateFunction',
                'lambda:DeleteFunction',
                'lambda:InvokeFunction',
                'lambda:UpdateFunctionCode',
                'lambda:UpdateFunctionConfiguration'
              ],
              resources: ['*'],
              effect: Effect.ALLOW,
              sid: 'AllowLambdaOperations'
            })
          ]
        })
      }
    });

    // Additional managed policies (optional)
//    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
  }
}




