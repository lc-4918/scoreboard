package com.cll

import com.cll.domain.ports.PlayerRepository
import io.mockk.mockk
import org.koin.dsl.module

/**
 * Module de test Koin qui fournit des mocks pour les dépendances.
 * 
 * Approche standard utilisant MockK pour tous les mocks.
 */
object TestModule {
    /**
     * Version standard du module de test utilisé pour les tests d'intégration.
     * Utilise des mocks relaxed pour simplifier les tests.
     */
    val module = module {
        single<PlayerRepository> { mockk(relaxed = true) }
    }
}