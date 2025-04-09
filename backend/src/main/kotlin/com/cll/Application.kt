package com.cll

import com.cll.application.routes.playerRoutes
import com.cll.domain.ports.PlayerRepository
import com.cll.domain.services.PlayerService
import com.cll.infrastructure.PlayerRepositoryImpl
import com.mongodb.kotlin.client.coroutine.MongoClient
import io.ktor.serialization.gson.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.routing.*
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    install(ContentNegotiation) {
        gson {}
    }
    install(CORS) {
        anyHost()
        allowMethod(io.ktor.http.HttpMethod.Options)
        allowMethod(io.ktor.http.HttpMethod.Post)
        allowMethod(io.ktor.http.HttpMethod.Put)
        allowMethod(io.ktor.http.HttpMethod.Delete)
        allowMethod(io.ktor.http.HttpMethod.Patch)
        allowHeader(io.ktor.http.HttpHeaders.Authorization)
        allowHeader(io.ktor.http.HttpHeaders.ContentType)
        allowCredentials = true
    }
    install(Koin) {
        slf4jLogger()
        modules(module {
            single {
                MongoClient.create(
                    environment.config.propertyOrNull("ktor.mongo.uri")?.getString()
                        ?: throw RuntimeException("Failed to access MongoDB URI")
                )
            }
            single { get<MongoClient>().getDatabase(environment.config.property("ktor.mongo.database").getString()) }
        }, module {
            single<PlayerRepository> { PlayerRepositoryImpl(get()) }
            single<PlayerService> { PlayerService(get<PlayerRepository>()) }
        })
    }
    routing {

        swaggerUI(path = "swagger-ui", swaggerFile = "openapi/documentation.yaml") {
            version = "4.15.5"
        }

        // Configuration pour servir les fichiers statiques Angular compilés
        staticResources("/", "static/browser") {
            default("index.html")
        }

        // Routes de l'API préfixées par /api
        route("/api") {
            playerRoutes()
        }
    }
}
