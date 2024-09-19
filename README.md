# Fastify Boilerplate

The Fastify boilerplate with all you need to build your SaaS, AI tool, or any other web app and make your first $ online fast.

## Get Started

```bash
git clone https://github.com/<USERNAME>/fastify-boilerplate.git

cd fastify-boilerplate

npm install

npm run dev

# go to http://localhost:8080
```

## Project Structure

* `.github`
    * `workflows`
        * `main.yaml`: ...
* `helm-charts`: Helm Chart
* `kubernetes`: Kubernetes manifest files
* `src`
    * `core`: contains the models, IOC container and application logic
        * `beetle`: ...
    * `hooks`: contains the custom hooks for Fastify such as the logger hook
    * `routes`: contains the routes for Fastify
    * `job.ts`: contains the `job()` function which will be executed once and only restarted upon failure, it's intended purpose is the run backgrounds tasks and/or listen to queues
    * `main.ts`: primary entry point
    * `server.ts`: contains the `startServer()` function which configures and starts the Fastify server
* `Dockerfile`

## Supported Cloud Providers

* [Digital Ocean](https://www.digitalocean.com/products/kubernetes)

## Deploy to Kubernetes

```bash
# Replace values in ./helm-charts/values.yaml

helm install my-fastify-boilerplate ./helm-charts
```

## Contributing

We love our contributors! Here's how you can contribute:

- [Open an issue](https://github.com/hirebarend/fastify-boilerplate/issues) if you believe you've encountered a bug.
- Make a [pull request](https://github.com/hirebarend/fastify-boilerplate/pull) to add new features/make quality-of-life improvements/fix bugs.