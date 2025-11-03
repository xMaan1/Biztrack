from typing import Dict, Type, Any, Callable, Optional, TypeVar
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')

class DIContainer:
    def __init__(self):
        self._services: Dict[Type, Any] = {}
        self._factories: Dict[Type, Callable] = {}
        self._singletons: Dict[Type, Any] = {}
        self._singleton_flags: Dict[Type, bool] = {}

    def register_instance(
        self,
        service_type: Type[T],
        instance: T
    ) -> None:
        self._services[service_type] = instance
        logger.debug(f"Registered instance for {service_type.__name__}")

    def register_factory(
        self,
        service_type: Type[T],
        factory: Callable[[], T],
        singleton: bool = False
    ) -> None:
        self._factories[service_type] = factory
        self._singleton_flags[service_type] = singleton
        logger.debug(
            f"Registered factory for {service_type.__name__} "
            f"(singleton={singleton})"
        )

    def register(
        self,
        service_type: Type[T],
        implementation_type: Type[T],
        singleton: bool = False
    ) -> None:
        def factory() -> T:
            return implementation_type()
        
        self.register_factory(service_type, factory, singleton)

    def resolve(self, service_type: Type[T]) -> T:
        if service_type in self._services:
            return self._services[service_type]

        if service_type in self._factories:
            if self._singleton_flags.get(service_type, False):
                if service_type not in self._singletons:
                    self._singletons[service_type] = self._factories[service_type]()
                return self._singletons[service_type]
            else:
                return self._factories[service_type]()

        raise ValueError(
            f"Service {service_type.__name__} is not registered in DI container"
        )

    def is_registered(self, service_type: Type) -> bool:
        return (
            service_type in self._services or
            service_type in self._factories
        )

    def clear(self) -> None:
        self._services.clear()
        self._factories.clear()
        self._singletons.clear()
        self._singleton_flags.clear()
        logger.debug("DI container cleared")

